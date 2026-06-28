import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EStatus } from '@/enums'

import {
    getAiredEpisodeCount,
    getAnimeStatus,
    getEpisodeTime,
    getExpectedEpisodeThisWeek,
    getFirstEpisodeTimestamp,
    getLastEpisodeTime,
    getLastEpisodeTimestamp,
    getMondayTimestampInThisWeek,
    getSundayTimestampInThisWeek,
    isCurrentWeekdayUpdateTimePassed,
    isUpdatedInThisWeek,
} from './time'

dayjs.extend(isoWeek)

describe('getFirstEpisodeTimestamp（从表单反推首集）', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })
    afterEach(() => {
        vi.useRealTimers()
    })

    it('更新日在今天之后（本周还未到）→ 用上周推', () => {
        // 周一，更新日是周六，本周六（7/4）还没到
        // currentEpisode=180 是上周六（6/27）播的
        vi.setSystemTime(new Date('2026-06-29T10:00:00'))

        const result = dayjs(
            getFirstEpisodeTimestamp({
                currentEpisode: 180,
                updateWeekday: 6, // 周六
                updateTimeHHmm: '2026-06-29 10:00',
            }),
        )
        // result + 179 周 = 上周六 6/27
        const episode180 = result.add(179, 'week')
        expect(episode180.format('YYYY-MM-DD')).toBe('2026-06-27')
        expect(episode180.isoWeekday()).toBe(6)
    })

    it('更新日在本周已过 → 用本周推', () => {
        // 周日，更新日是周六，本周六（7/4）已过
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

    it('首集 + (n-1)*7天 = 第n集播出时间', () => {
        vi.setSystemTime(new Date('2026-06-29T10:00:00'))

        const first = getFirstEpisodeTimestamp({
            currentEpisode: 10,
            updateWeekday: 3, // 周三
            updateTimeHHmm: '2026-06-29 10:00',
        })
        // 第1集 = 首集时间
        const ep1 = dayjs(first)
        // 第10集 = 首集 + 9*7 天
        const ep10 = dayjs(first).add(9 * 7, 'day')
        expect(ep10.diff(ep1, 'day')).toBe(63)
    })
})

describe('getAnimeStatus（时间跨度增强）', () => {
    it('远未来（提前100天）=> 即将更新', () => {
        const now = dayjs()
        const first = now.add(100, 'day')

        expect(getAnimeStatus(10, first.valueOf(), now.valueOf())).toBe(EStatus.toBeUpdated)
    })

    it('刚开播（第0天）=> 连载中', () => {
        const now = dayjs()
        const first = now

        expect(getAnimeStatus(10, first.valueOf(), now.valueOf())).toBe(EStatus.serializing)
    })

    it('刚好卡在最后一集当天 => 已完结', () => {
        const now = dayjs()
        const first = now.add(-(9 * 7), 'day') // 第10集今天

        expect(getAnimeStatus(10, first.valueOf(), now.valueOf())).toBe(EStatus.completed)
    })

    it('完结后很久（+200天）=> 已完结稳定', () => {
        const now = dayjs()
        const first = now.add(-200, 'day')

        expect(getAnimeStatus(10, first.valueOf(), now.valueOf())).toBe(EStatus.completed)
    })
})

describe('getAiredEpisodeCount（时间分段验证）', () => {
    it('刚开播当天 => 1', () => {
        const now = dayjs()
        const first = now

        expect(getAiredEpisodeCount(10, first.valueOf(), now.valueOf())).toBe(1)
    })

    it('第2集临界点（6~8天）=> 2', () => {
        const now = dayjs()

        const first = now.add(-6, 'day')
        const result1 = getAiredEpisodeCount(10, first.valueOf(), now.valueOf())

        const first2 = now.add(-8, 'day')
        const result2 = getAiredEpisodeCount(10, first2.valueOf(), now.valueOf())

        expect(result1).toBe(1)
        expect(result2).toBe(2)
    })

    it('第5集稳定区间 => diff正确累积', () => {
        const now = dayjs()
        const first = now.add(-(4 * 7 + 1), 'day')

        expect(getAiredEpisodeCount(10, first.valueOf(), now.valueOf())).toBe(5)
    })

    it('完结后 + 100天 => 仍然是 totalEpisode', () => {
        const now = dayjs()
        const first = now.add(-(200 * 7), 'day')

        expect(getAiredEpisodeCount(10, first.valueOf(), now.valueOf())).toBe(10)
    })

    it('第0天 => 第1集', () => {
        const now = dayjs()
        const first = now

        expect(getAiredEpisodeCount(10, first.valueOf(), now.valueOf())).toBe(1)
    })

    it('刚好7天 => 第2集', () => {
        const now = dayjs()
        const first = now.add(-7, 'day')

        expect(getAiredEpisodeCount(10, first.valueOf(), now.valueOf())).toBe(2)
    })

    it('超过总集数不溢出', () => {
        const now = dayjs()
        const first = now.add(-(200 * 7), 'day')

        expect(getAiredEpisodeCount(5, first.valueOf(), now.valueOf())).toBe(5)
    })
})

describe('isUpdatedInThisWeek（跨周测试）', () => {
    it('本周内刚好有一集 => true', () => {
        const now = dayjs()

        const weekStart = now.startOf('isoWeek')
        const first = weekStart.add(-7, 'day')

        expect(isUpdatedInThisWeek(10, first.valueOf(), now.valueOf())).toBe(true)
    })

    it('跨周边界（上周末）=> false', () => {
        const now = dayjs()

        const weekStart = now.startOf('isoWeek')
        const first = weekStart.add(-14, 'day')

        expect(isUpdatedInThisWeek(2, first.valueOf(), now.valueOf())).toBe(false)
    })

    it('多周跨度（100天前）=> false', () => {
        const now = dayjs()

        const first = now.add(-100, 'day')

        expect(isUpdatedInThisWeek(3, first.valueOf(), now.valueOf())).toBe(false)
    })

    it('周一边界 => true', () => {
        const now = dayjs().startOf('isoWeek')

        const first = now

        expect(isUpdatedInThisWeek(10, first.valueOf(), now.valueOf())).toBe(true)
    })

    it('周日边界 => true', () => {
        const now = dayjs().endOf('isoWeek')

        const first = now.add(-7, 'day')

        expect(isUpdatedInThisWeek(10, first.valueOf(), now.valueOf())).toBe(true)
    })
})

describe('getExpectedEpisodeThisWeek（极端场景）', () => {
    it('刚开播本周 => 1', () => {
        const now = dayjs()
        const first = now

        const result = getExpectedEpisodeThisWeek(10, first.valueOf(), EStatus.serializing, now.valueOf())

        expect(result).toBe(1)
    })

    it('跨月 + 本周尾部 => 不越界', () => {
        const now = dayjs()
        const first = now.add(-200, 'day')
        const result = getExpectedEpisodeThisWeek(5, first.valueOf(), EStatus.serializing, now.valueOf())
        expect(result).toBe(5)
    })

    it('连载中 => 返回合理范围', () => {
        const now = dayjs()
        const first = now.add(-(3 * 7 + 1), 'day')

        const result = getExpectedEpisodeThisWeek(10, first.valueOf(), EStatus.serializing, now.valueOf())

        expect(result).toBeGreaterThanOrEqual(1)
        expect(result).toBeLessThanOrEqual(10)
    })
})

describe('getLastEpisodeTimestamp（长期稳定性）', () => {
    it('不同时间点计算结果一致性', () => {
        const base = dayjs().add(-50, 'day')

        const first = base

        const r1 = getLastEpisodeTimestamp(10, first.valueOf())
        const r2 = getLastEpisodeTimestamp(10, first.valueOf())

        expect(r1).toBe(r2)
    })

    it('时间再往前推1000天仍然正确', () => {
        const first = dayjs().add(-1000, 'day')

        const result = getLastEpisodeTimestamp(10, first.valueOf())

        const expected = dayjs(first).add(9 * 7, 'day')

        expect(dayjs(result).isSame(expected)).toBe(true)
    })

    it('last episode = first + (n-1)*7', () => {
        const first = dayjs().add(-100, 'day')

        const result = getLastEpisodeTimestamp(10, first.valueOf())

        const expected = dayjs(first).add(9 * 7, 'day')

        expect(result).toBe(expected.valueOf())
    })
})

describe('getEpisodeTime（第n集播出时间）', () => {
    it('第1集 = 首集时间本身', () => {
        const first = dayjs('2026-01-01T12:00:00').valueOf()
        const result = getEpisodeTime(first, 1)
        expect(result.valueOf()).toBe(first)
    })

    it('第10集 = 首集 + 9*7天', () => {
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
    it('总集数12 → 最后一个 = 第12集时间', () => {
        const first = dayjs('2026-01-01').valueOf()
        const last = getLastEpisodeTime(first, 12)
        const expected = getEpisodeTime(first, 12)
        expect(last.valueOf()).toBe(expected.valueOf())
    })
})

describe('getMondayTimestampInThisWeek', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })
    afterEach(() => {
        vi.useRealTimers()
    })

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
    beforeEach(() => {
        vi.useFakeTimers()
    })
    afterEach(() => {
        vi.useRealTimers()
    })

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
    beforeEach(() => {
        vi.useFakeTimers()
    })
    afterEach(() => {
        vi.useRealTimers()
    })

    it('传入过去时间 → true', () => {
        vi.setSystemTime(new Date('2026-06-29T12:00:00'))
        expect(isCurrentWeekdayUpdateTimePassed('2026-06-29 10:00')).toBe(true)
    })

    it('传入未来时间 → false', () => {
        vi.setSystemTime(new Date('2026-06-29T10:00:00'))
        expect(isCurrentWeekdayUpdateTimePassed('2026-06-29 12:00')).toBe(false)
    })

    it('传入相同时间 → false（isAfter 严格大于）', () => {
        vi.setSystemTime(new Date('2026-06-29T10:00:00'))
        expect(isCurrentWeekdayUpdateTimePassed('2026-06-29 10:00')).toBe(false)
    })
})
