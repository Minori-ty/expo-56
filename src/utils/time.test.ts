import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EStatus } from '@/enums'

import {
    computeFirstEpisodeTimestamp,
    getAiredEpisodeCount,
    getAnimeStatus,
    getEpisodeTime,
    getExpectedEpisodeThisWeek,
    getFirstEpisodeTimestamp,
    getFirstEpisodeTimestampFromLast,
    getLastEpisodeTime,
    getLastEpisodeTimestamp,
    getMondayTimestampInThisWeek,
    getSundayTimestampInThisWeek,
    isCurrentWeekdayUpdateTimePassed,
    isUpdatedInThisWeek,
} from './time'

dayjs.extend(isoWeek)

// ─── 统一基准时间：2026-07-02 周四 10:00 ────────────────────────────────────────
const NOW = new Date('2026-07-02T10:00:00')
// ISO 周：周一 2026-06-29 ～ 周日 2026-07-05

/** 设置 fake timers 到统一基准时间 */
function useFakeNow() {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(NOW)
    })
    afterEach(() => {
        vi.useRealTimers()
    })
}

// ═══════════════════════════════════════════════════════════════════════════════
// 不依赖"当前时间"的纯函数 —— 固定输入日期，结果 100% 确定
// ═══════════════════════════════════════════════════════════════════════════════

describe('getEpisodeTime（第 n 集播出时间）', () => {
    it('第1集 = 首集时间本身', () => {
        const first = dayjs('2026-01-01T12:00:00').valueOf()
        const result = getEpisodeTime(first, 1)
        expect(result.valueOf()).toBe(first)
    })

    it('第10集 = 首集 + 9×7天', () => {
        const first = dayjs('2026-01-01T12:00:00').valueOf()
        const result = getEpisodeTime(first, 10)
        const expected = dayjs(first).add(9 * 7, 'day')
        expect(result.valueOf()).toBe(expected.valueOf())
    })

    it('第0集会前移7天（调用方负责边界，函数仅做数学计算）', () => {
        const first = dayjs('2026-01-01T12:00:00').valueOf()
        const result = getEpisodeTime(first, 0)
        const expected = dayjs(first).add(-7, 'day')
        expect(result.valueOf()).toBe(expected.valueOf())
    })

    it('大集数不会溢出', () => {
        const first = dayjs('2020-01-01').valueOf()
        const result = getEpisodeTime(first, 1000)
        const expected = dayjs(first).add(999 * 7, 'day')
        expect(result.valueOf()).toBe(expected.valueOf())
    })
})

describe('getLastEpisodeTime', () => {
    it('总集数12 → 最后一集 = 第12集时间', () => {
        const first = dayjs('2026-01-01').valueOf()
        const last = getLastEpisodeTime(first, 12)
        const expected = getEpisodeTime(first, 12)
        expect(last.valueOf()).toBe(expected.valueOf())
    })
})

describe('getFirstEpisodeTimestampFromLast（完结反推首集）', () => {
    it('12集完结 → 首集 = 完结 - 11×7天，秒清零', () => {
        const last = dayjs('2026-12-31T10:30:45').valueOf()
        const first = getFirstEpisodeTimestampFromLast(12, last)
        const firstDay = dayjs(first)

        expect(firstDay.format('YYYY-MM-DD')).toBe('2026-10-15')
        expect(firstDay.second()).toBe(0)
        // 首集 + 11周 = 完结（秒也被清零）
        expect(firstDay.add(11, 'week').valueOf()).toBe(dayjs(last).second(0).valueOf())
    })

    it('1集完结 → 首集 = 完结时间（不减周）', () => {
        const last = dayjs('2026-12-31T10:30:45').valueOf()
        const first = getFirstEpisodeTimestampFromLast(1, last)
        const firstDay = dayjs(first)

        expect(firstDay.format('YYYY-MM-DD')).toBe('2026-12-31')
        expect(firstDay.second()).toBe(0)
    })

    it('100集完结 → 正确计算大跨度', () => {
        const last = dayjs('2026-12-31T10:30:45').valueOf()
        const first = getFirstEpisodeTimestampFromLast(100, last)
        const firstDay = dayjs(first)

        expect(firstDay.add(99, 'week').valueOf()).toBe(dayjs(last).second(0).valueOf())
    })
})

describe('getLastEpisodeTimestamp（长期稳定性）', () => {
    it('last episode = first + (n-1)×7', () => {
        const first = dayjs('2026-04-01T10:00:00').valueOf()
        const result = getLastEpisodeTimestamp(10, first)
        const expected = dayjs(first).add(9 * 7, 'day')
        expect(result).toBe(expected.valueOf())
    })

    it('不同时间点计算结果一致性', () => {
        const first = dayjs('2026-04-01T10:00:00').valueOf()
        const r1 = getLastEpisodeTimestamp(10, first)
        const r2 = getLastEpisodeTimestamp(10, first)
        expect(r1).toBe(r2)
    })

    it('时间再往前推1000天仍然正确', () => {
        const first = dayjs('2026-04-01T10:00:00').add(-1000, 'day').valueOf()
        const result = getLastEpisodeTimestamp(10, first)
        const expected = dayjs(first).add(9 * 7, 'day')
        expect(dayjs(result).isSame(expected)).toBe(true)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 依赖"当前时间"的函数 —— 统一 fake timers，所有断言基于固定日期推导
// ═══════════════════════════════════════════════════════════════════════════════

describe('getFirstEpisodeTimestamp（从表单反推首集）', () => {
    useFakeNow()

    it('更新日在今天之后（本周还未到）→ 用上周推', () => {
        // now = 周四 7/2，更新日周六（7/4）还没到
        // currentEpisode=180 → 上周六（6/27）是第180集
        vi.setSystemTime(new Date('2026-07-02T10:00:00'))

        const result = dayjs(
            getFirstEpisodeTimestamp({
                currentEpisode: 180,
                updateWeekday: 6, // 周六
                updateTimeHHmm: '2026-07-02 10:00',
            }),
        )
        // result + 179 周 = 上周六 6/27
        const episode180 = result.add(179, 'week')
        expect(episode180.format('YYYY-MM-DD')).toBe('2026-06-27')
        expect(episode180.isoWeekday()).toBe(6)
    })

    it('更新日在本周已过 → 用本周推', () => {
        // 周日 7/5，更新日周六（7/4）已过
        vi.setSystemTime(new Date('2026-07-05T10:00:00'))

        const result = dayjs(
            getFirstEpisodeTimestamp({
                currentEpisode: 180,
                updateWeekday: 6, // 周六
                updateTimeHHmm: '2026-07-05 10:00',
            }),
        )
        // result + 179 周 = 本周六 7/4
        const episode180 = result.add(179, 'week')
        expect(episode180.format('YYYY-MM-DD')).toBe('2026-07-04')
        expect(episode180.isoWeekday()).toBe(6)
    })

    it('首集 + (n-1)×7天 = 第n集播出时间', () => {
        vi.setSystemTime(new Date('2026-07-02T10:00:00'))

        const first = getFirstEpisodeTimestamp({
            currentEpisode: 10,
            updateWeekday: 3, // 周三
            updateTimeHHmm: '2026-07-02 10:00',
        })
        const ep1 = dayjs(first)
        const ep10 = dayjs(first).add(9 * 7, 'day')
        expect(ep10.diff(ep1, 'day')).toBe(63)
    })
})

describe('getAnimeStatus（时间跨度）', () => {
    useFakeNow()

    it('远未来（提前100天）→ 即将更新', () => {
        const first = dayjs(NOW).add(100, 'day')
        expect(getAnimeStatus(10, first.valueOf())).toBe(EStatus.toBeUpdated)
    })

    it('刚开播（当天）→ 连载中', () => {
        const first = dayjs(NOW)
        expect(getAnimeStatus(10, first.valueOf())).toBe(EStatus.serializing)
    })

    it('刚好卡在最后一集当天 → 已完结', () => {
        // 10集，首集 = NOW - 9×7天 = 第10集刚好今天
        const first = dayjs(NOW).add(-9 * 7, 'day')
        expect(getAnimeStatus(10, first.valueOf())).toBe(EStatus.completed)
    })

    it('完结后很久（+200天）→ 已完结稳定', () => {
        const first = dayjs(NOW).add(-200, 'day')
        expect(getAnimeStatus(10, first.valueOf())).toBe(EStatus.completed)
    })
})

describe('getAiredEpisodeCount（时间分段验证）', () => {
    useFakeNow()

    it('刚开播当天 → 1', () => {
        const first = dayjs(NOW)
        expect(getAiredEpisodeCount(10, first.valueOf())).toBe(1)
    })

    it('第2集临界点：6天→1，8天→2', () => {
        const first6 = dayjs(NOW).add(-6, 'day')
        const first8 = dayjs(NOW).add(-8, 'day')

        expect(getAiredEpisodeCount(10, first6.valueOf())).toBe(1)
        expect(getAiredEpisodeCount(10, first8.valueOf())).toBe(2)
    })

    it('第5集稳定区间 → diff正确累积', () => {
        const first = dayjs(NOW).add(-(4 * 7 + 1), 'day')
        expect(getAiredEpisodeCount(10, first.valueOf())).toBe(5)
    })

    it('完结后 + 100×7天 → 仍然是 totalEpisode', () => {
        const first = dayjs(NOW).add(-(200 * 7), 'day')
        expect(getAiredEpisodeCount(10, first.valueOf())).toBe(10)
    })

    it('刚好7天 → 第2集', () => {
        const first = dayjs(NOW).add(-7, 'day')
        expect(getAiredEpisodeCount(10, first.valueOf())).toBe(2)
    })

    it('超过总集数不溢出', () => {
        const first = dayjs(NOW).add(-(200 * 7), 'day')
        expect(getAiredEpisodeCount(5, first.valueOf())).toBe(5)
    })
})

describe('isUpdatedInThisWeek（跨周测试）', () => {
    useFakeNow()

    it('本周内刚好有一集 → true', () => {
        // 首集 = 本周一之前7天 → 第2集落在本周一
        const weekStart = dayjs(NOW).startOf('isoWeek') // 2026-06-29
        const first = weekStart.add(-7, 'day') // 2026-06-22
        expect(isUpdatedInThisWeek(10, first.valueOf())).toBe(true)
    })

    it('跨周边界（上周末）→ false', () => {
        // 第2集在上周播完，总共2集 → 本周无更新
        const weekStart = dayjs(NOW).startOf('isoWeek') // 2026-06-29
        const first = weekStart.add(-14, 'day') // 2026-06-15
        expect(isUpdatedInThisWeek(2, first.valueOf())).toBe(false)
    })

    it('多周跨度（100天前）→ false', () => {
        const first = dayjs(NOW).add(-100, 'day')
        expect(isUpdatedInThisWeek(3, first.valueOf())).toBe(false)
    })

    it('周一边界 → true', () => {
        const monday = dayjs(NOW).startOf('isoWeek') // 2026-06-29
        expect(isUpdatedInThisWeek(10, monday.valueOf())).toBe(true)
    })

    it('周日边界 → true', () => {
        // 首集在上周日之前7天 → 第2集落在上周日（即本 ISO 周最后一天）
        const sunday = dayjs(NOW).endOf('isoWeek') // 2026-07-05
        const first = sunday.add(-7, 'day') // 2026-06-28
        expect(isUpdatedInThisWeek(10, first.valueOf())).toBe(true)
    })
})

describe('getExpectedEpisodeThisWeek（极端场景）', () => {
    useFakeNow()

    it('刚开播本周 → 1', () => {
        const first = dayjs(NOW)
        const result = getExpectedEpisodeThisWeek(10, first.valueOf(), EStatus.serializing)
        expect(result).toBe(1)
    })

    it('跨月 + 本周尾部 → 不越界', () => {
        const first = dayjs(NOW).add(-200, 'day')
        const result = getExpectedEpisodeThisWeek(5, first.valueOf(), EStatus.serializing)
        expect(result).toBe(5)
    })

    it('连载中 → 返回合理范围', () => {
        const first = dayjs(NOW).add(-(3 * 7 + 1), 'day')
        const result = getExpectedEpisodeThisWeek(10, first.valueOf(), EStatus.serializing)
        expect(result).toBeGreaterThanOrEqual(1)
        expect(result).toBeLessThanOrEqual(10)
    })
})

describe('getMondayTimestampInThisWeek', () => {
    useFakeNow()

    it('返回本周一 00:00:00 的时间戳', () => {
        vi.setSystemTime(new Date('2026-07-02T15:30:00')) // 周四

        const monday = dayjs(getMondayTimestampInThisWeek())
        expect(monday.format('YYYY-MM-DD')).toBe('2026-06-29')
        expect(monday.hour()).toBe(0)
        expect(monday.minute()).toBe(0)
        expect(monday.second()).toBe(0)
    })

    it('周一当天返回当天 00:00:00', () => {
        vi.setSystemTime(new Date('2026-06-29T10:00:00'))

        const monday = dayjs(getMondayTimestampInThisWeek())
        expect(monday.format('YYYY-MM-DD')).toBe('2026-06-29')
    })
})

describe('getSundayTimestampInThisWeek', () => {
    useFakeNow()

    it('返回本周日 23:59:59 的时间戳', () => {
        vi.setSystemTime(new Date('2026-06-29T10:00:00')) // 周一

        const sunday = dayjs(getSundayTimestampInThisWeek())
        expect(sunday.format('YYYY-MM-DD')).toBe('2026-07-05')
        expect(sunday.hour()).toBe(23)
        expect(sunday.minute()).toBe(59)
        expect(sunday.second()).toBe(59)
    })
})

describe('isCurrentWeekdayUpdateTimePassed', () => {
    useFakeNow()

    it('传入过去时间 → true', () => {
        vi.setSystemTime(new Date('2026-07-02T12:00:00'))
        expect(isCurrentWeekdayUpdateTimePassed('2026-07-02 10:00')).toBe(true)
    })

    it('传入未来时间 → false', () => {
        vi.setSystemTime(new Date('2026-07-02T10:00:00'))
        expect(isCurrentWeekdayUpdateTimePassed('2026-07-02 12:00')).toBe(false)
    })

    it('传入相同时间 → false（isAfter 严格大于）', () => {
        vi.setSystemTime(new Date('2026-07-02T10:00:00'))
        expect(isCurrentWeekdayUpdateTimePassed('2026-07-02 10:00')).toBe(false)
    })
})

describe('computeFirstEpisodeTimestamp（表单数据反推首集）', () => {
    useFakeNow()

    it('连载中状态 → 用当前集数和更新时间反推', () => {
        vi.setSystemTime(new Date('2026-07-02T10:00:00')) // 周四

        const result = computeFirstEpisodeTimestamp({
            status: EStatus.serializing,
            currentEpisode: 180,
            updateWeekday: 6, // 周六
            updateTimeHHmm: '2026-07-02 10:00',
        })

        // 周六(7/4)还没到 → 用上周六(6/27) = 第180集
        const ep180 = dayjs(result).add(179, 'week')
        expect(ep180.format('YYYY-MM-DD')).toBe('2026-06-27')
        expect(ep180.isoWeekday()).toBe(6)
    })

    it('已完结状态 → 用完结时间反推', () => {
        const result = computeFirstEpisodeTimestamp({
            status: EStatus.completed,
            totalEpisode: 12,
            lastEpisodeYYYYMMDDHHmm: '2026-12-31 10:30',
        })

        const last = dayjs(result).add(11, 'week')
        expect(last.format('YYYY-MM-DD HH:mm')).toBe('2026-12-31 10:30')
    })

    it('即将更新状态 → 直接使用首播时间，秒清零', () => {
        const result = computeFirstEpisodeTimestamp({
            status: EStatus.toBeUpdated,
            firstEpisodeYYYYMMDDHHmm: '2026-12-31 10:30:45',
        })

        const first = dayjs(result)
        expect(first.format('YYYY-MM-DD HH:mm')).toBe('2026-12-31 10:30')
        expect(first.second()).toBe(0)
    })
})
