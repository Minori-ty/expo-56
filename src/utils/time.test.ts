import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { describe, expect, it } from 'vitest'

import { EStatus } from '@/enums'

import {
    getAiredEpisodeCount,
    getAnimeStatus,
    getExpectedEpisodeThisWeek,
    getLastEpisodeTimestamp,
    isUpdatedInThisWeek,
} from './time'

dayjs.extend(isoWeek)

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
