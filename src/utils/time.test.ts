import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EStatus, EWeekday } from '@/enums'

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
    getWeekday,
    isCurrentWeekdayUpdateTimePassed,
    isUpdatedInThisWeek,
} from './time'

dayjs.extend(isoWeek)

// ─── 统一基准时间：2026-07-02 周四 10:00 ────────────────────────────────────────
// ISO 周：周一 2026-06-29 ～ 周日 2026-07-05

/** 设置 fake timers 到统一基准时间 */
function useFakeNow(now?: Date) {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(now ?? new Date('2026-07-02T10:00:00'))
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
        const expected = dayjs('2026-03-05T12:00:00') // +63 days
        expect(result.valueOf()).toBe(expected.valueOf())
    })

    it('第0集会前移7天（调用方负责边界，函数仅做数学计算）', () => {
        const first = dayjs('2026-01-01T12:00:00').valueOf()
        const result = getEpisodeTime(first, 0)
        const expected = dayjs('2025-12-25T12:00:00') // -7 days
        expect(result.valueOf()).toBe(expected.valueOf())
    })

    it('大集数不会溢出', () => {
        const first = dayjs('2020-01-01').valueOf()
        const result = getEpisodeTime(first, 1000)
        const expected = dayjs('2039-02-23') // +999×7 days
        expect(result.valueOf()).toBe(expected.valueOf())
    })
})

describe('getLastEpisodeTime', () => {
    it('总集数12 → 最后一集 = 第12集时间', () => {
        const first = dayjs('2026-01-01').valueOf()
        const last = getLastEpisodeTime(first, 12)
        const expected = dayjs('2026-03-19') // +77 days
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
        expect(firstDay.add(11, 'week').valueOf()).toBe(dayjs('2026-12-31T10:30:00').valueOf())
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

        expect(firstDay.add(99, 'week').valueOf()).toBe(dayjs('2026-12-31T10:30:00').valueOf())
    })
})

describe('getLastEpisodeTimestamp（长期稳定性）', () => {
    it('last episode = first + (n-1)×7', () => {
        const first = dayjs('2026-04-01T10:00:00').valueOf()
        const result = getLastEpisodeTimestamp(10, first)
        const expected = dayjs('2026-06-03T10:00:00') // +63 days
        expect(result).toBe(expected.valueOf())
    })

    it('不同时间点计算结果一致性', () => {
        const first = dayjs('2026-04-01T10:00:00').valueOf()
        const r1 = getLastEpisodeTimestamp(10, first)
        const r2 = getLastEpisodeTimestamp(10, first)
        expect(r1).toBe(r2)
    })

    it('时间再往前推1000天仍然正确', () => {
        const first = dayjs('2023-07-06T10:00:00').valueOf() // 2026-04-01 - 1000 days
        const result = getLastEpisodeTimestamp(10, first)
        const expected = dayjs('2023-09-07T10:00:00') // +63 days
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
        // NOW + 100d = 2026-10-10
        const first = dayjs('2026-10-10').valueOf()
        expect(getAnimeStatus(10, first)).toBe(EStatus.toBeUpdated)
    })

    it('刚开播（当天）→ 连载中', () => {
        const first = dayjs('2026-07-02').valueOf()
        expect(getAnimeStatus(10, first)).toBe(EStatus.serializing)
    })

    it('刚好卡在最后一集当天 → 已完结', () => {
        // 10集，首集 = 2026-07-02 - 63d = 2026-04-30，第10集刚好 2026-07-02
        const first = dayjs('2026-04-30').valueOf()
        expect(getAnimeStatus(10, first)).toBe(EStatus.completed)
    })

    it('完结后很久（+200天）→ 已完结稳定', () => {
        // NOW - 200d = 2025-12-14
        const first = dayjs('2025-12-14').valueOf()
        expect(getAnimeStatus(10, first)).toBe(EStatus.completed)
    })

    it('差 1ms 到最后一集 → 仍是连载中', () => {
        // 12集，首集 = 2026-07-02 - 77d + 1ms = 2026-04-16T10:00:00.001
        // 第12集在 2026-07-02T10:00:00.001，还没到
        const first = dayjs('2026-04-16T10:00:00.001').valueOf()
        expect(getAnimeStatus(12, first)).toBe(EStatus.serializing)
    })
})

describe('getAiredEpisodeCount（时间分段验证）', () => {
    useFakeNow()

    it('刚开播当天 → 1', () => {
        const first = dayjs('2026-07-02').valueOf()
        expect(getAiredEpisodeCount(10, first)).toBe(1)
    })

    it('第2集临界点：6天→1，8天→2', () => {
        const first6 = dayjs('2026-06-26').valueOf() // NOW - 6d
        const first8 = dayjs('2026-06-24').valueOf() // NOW - 8d

        expect(getAiredEpisodeCount(10, first6)).toBe(1)
        expect(getAiredEpisodeCount(10, first8)).toBe(2)
    })

    it('第5集稳定区间 → diff正确累积', () => {
        // NOW - 29d = 2026-06-03
        const first = dayjs('2026-06-03').valueOf()
        expect(getAiredEpisodeCount(10, first)).toBe(5)
    })

    it('完结后 + 100×7天 → 仍然是 totalEpisode', () => {
        // NOW - 1400d = 2022-09-02
        const first = dayjs('2022-09-02').valueOf()
        expect(getAiredEpisodeCount(10, first)).toBe(10)
    })

    it('刚好7天 → 第2集', () => {
        const first = dayjs('2026-06-25').valueOf() // NOW - 7d
        expect(getAiredEpisodeCount(10, first)).toBe(2)
    })

    it('超过总集数不溢出', () => {
        const first = dayjs('2022-09-02').valueOf() // NOW - 1400d
        expect(getAiredEpisodeCount(5, first)).toBe(5)
    })
})

describe('isUpdatedInThisWeek（跨周测试）', () => {
    useFakeNow()

    it('本周内刚好有一集 → true', () => {
        // 首集 = 2026-06-22（本周一 6/29 前7天），第2集落在本周一 6/29
        const first = dayjs('2026-06-22').valueOf()
        expect(isUpdatedInThisWeek(10, first)).toBe(true)
    })

    it('跨周边界（上周末）→ false', () => {
        // 第2集在上周播完，总共2集 → 本周无更新
        const first = dayjs('2026-06-15').valueOf() // 本周一 6/29 前14天
        expect(isUpdatedInThisWeek(2, first)).toBe(false)
    })

    it('多周跨度（100天前）→ false', () => {
        const first = dayjs('2026-03-24').valueOf() // NOW - 100d
        expect(isUpdatedInThisWeek(3, first)).toBe(false)
    })

    it('周一边界 → true', () => {
        const monday = dayjs('2026-06-29').valueOf()
        expect(isUpdatedInThisWeek(10, monday)).toBe(true)
    })

    it('周日边界 → true', () => {
        // 首集 = 2026-06-28（本周日 7/5 前7天），第2集落在本周日 7/5
        const first = dayjs('2026-06-28').valueOf()
        expect(isUpdatedInThisWeek(10, first)).toBe(true)
    })

    it('首集在未来 → false', () => {
        const first = dayjs('2026-08-01').valueOf() // NOW + 30d
        expect(isUpdatedInThisWeek(10, first)).toBe(false)
    })
})

describe('getExpectedEpisodeThisWeek（极端场景）', () => {
    useFakeNow()

    it('刚开播本周 → 1', () => {
        const first = dayjs('2026-07-02').valueOf()
        const result = getExpectedEpisodeThisWeek(10, first, EStatus.serializing)
        expect(result).toBe(1)
    })

    it('跨月 + 本周尾部 → 不越界', () => {
        // NOW - 200d = 2025-12-14
        const first = dayjs('2025-12-14').valueOf()
        const result = getExpectedEpisodeThisWeek(5, first, EStatus.serializing)
        expect(result).toBe(5)
    })

    it('连载中 → 返回合理范围', () => {
        // NOW - 22d = 2026-06-10
        const first = dayjs('2026-06-10').valueOf()
        const result = getExpectedEpisodeThisWeek(10, first, EStatus.serializing)
        expect(result).toBeGreaterThanOrEqual(1)
        expect(result).toBeLessThanOrEqual(10)
    })

    it('已完结状态 → 返回 totalEpisode', () => {
        const first = dayjs('2025-12-14').valueOf() // NOW - 200d
        const result = getExpectedEpisodeThisWeek(12, first, EStatus.completed)
        expect(result).toBe(12)
    })

    it('未开播（now < first）→ 返回 1', () => {
        const first = dayjs('2026-08-21').valueOf() // NOW + 50d
        const result = getExpectedEpisodeThisWeek(12, first, EStatus.toBeUpdated)
        expect(result).toBe(1)
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

    // ── 异常分支 ──

    it('连载中状态缺少 currentEpisode → 抛出异常', () => {
        expect(() =>
            computeFirstEpisodeTimestamp({
                status: EStatus.serializing,
                updateWeekday: 6,
                updateTimeHHmm: '10:00',
            }),
        ).toThrow('serializing 状态下 currentEpisode、updateTimeHHmm、updateWeekday 必填')
    })

    it('连载中状态缺少 updateTimeHHmm → 抛出异常', () => {
        expect(() =>
            computeFirstEpisodeTimestamp({
                status: EStatus.serializing,
                currentEpisode: 10,
                updateWeekday: 6,
            }),
        ).toThrow('serializing 状态下 currentEpisode、updateTimeHHmm、updateWeekday 必填')
    })

    it('连载中状态缺少 updateWeekday → 抛出异常', () => {
        expect(() =>
            computeFirstEpisodeTimestamp({
                status: EStatus.serializing,
                currentEpisode: 10,
                updateTimeHHmm: '10:00',
            }),
        ).toThrow('serializing 状态下 currentEpisode、updateTimeHHmm、updateWeekday 必填')
    })

    it('已完结状态缺少 totalEpisode → 抛出异常', () => {
        expect(() =>
            computeFirstEpisodeTimestamp({
                status: EStatus.completed,
                lastEpisodeYYYYMMDDHHmm: '2026-12-31 10:30',
            }),
        ).toThrow('completed 状态下 totalEpisode、lastEpisodeYYYYMMDDHHmm 必填')
    })

    it('已完结状态缺少 lastEpisodeYYYYMMDDHHmm → 抛出异常', () => {
        expect(() =>
            computeFirstEpisodeTimestamp({
                status: EStatus.completed,
                totalEpisode: 12,
            }),
        ).toThrow('completed 状态下 totalEpisode、lastEpisodeYYYYMMDDHHmm 必填')
    })

    it('即将更新状态缺少 firstEpisodeYYYYMMDDHHmm → 抛出异常', () => {
        expect(() =>
            computeFirstEpisodeTimestamp({
                status: EStatus.toBeUpdated,
            }),
        ).toThrow('toBeUpdated 状态下 firstEpisodeYYYYMMDDHHmm 必填')
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
// getWeekday
// ═══════════════════════════════════════════════════════════════════════════════

describe('getWeekday（星期获取）', () => {
    useFakeNow()

    it('当前时间 → 返回当前星期（周四 = 4）', () => {
        vi.setSystemTime(new Date('2026-07-02T10:00:00')) // 周四
        expect(getWeekday()).toBe(EWeekday.thursday)
    })

    it('传入时间戳 → 返回对应星期', () => {
        // 2026-07-06 = 周一
        const monday = dayjs('2026-07-06').valueOf()
        expect(getWeekday(monday)).toBe(EWeekday.monday)

        // 2026-07-12 = 周日
        const sunday = dayjs('2026-07-12').valueOf()
        expect(getWeekday(sunday)).toBe(EWeekday.sunday)
    })

    it('覆盖所有星期 1-7', () => {
        // 2026-06-29 是周一
        expect(getWeekday(dayjs('2026-06-29').valueOf())).toBe(EWeekday.monday)
        expect(getWeekday(dayjs('2026-06-30').valueOf())).toBe(EWeekday.tuesday)
        expect(getWeekday(dayjs('2026-07-01').valueOf())).toBe(EWeekday.wednesday)
        expect(getWeekday(dayjs('2026-07-02').valueOf())).toBe(EWeekday.thursday)
        expect(getWeekday(dayjs('2026-07-03').valueOf())).toBe(EWeekday.friday)
        expect(getWeekday(dayjs('2026-07-04').valueOf())).toBe(EWeekday.saturday)
        expect(getWeekday(dayjs('2026-07-05').valueOf())).toBe(EWeekday.sunday)
    })

    it('传入毫秒级时间戳不影响结果', () => {
        const d = dayjs('2026-07-01T23:59:59.999').valueOf() // 周三
        expect(getWeekday(d)).toBe(EWeekday.wednesday)
    })
})
