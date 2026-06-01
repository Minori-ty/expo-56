import { EStatus } from '@/enums'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.extend(isoWeek)

const EPISODE_INTERVAL_DAYS = 7

/**
 * 获取第 n 集的播出时间
 * @param first 第1集播出时间戳
 * @param episodeIndex 第几集（从1开始）
 * @returns 该集播出时间（dayjs对象）
 */
export function getEpisodeTime(first: number, episodeIndex: number) {
    return dayjs(first).add((episodeIndex - 1) * EPISODE_INTERVAL_DAYS, 'day')
}

/**
 * 获取最后一集的播出时间
 * @param first 第1集播出时间戳
 * @param total 总集数
 * @returns 最后一集播出时间（dayjs对象）
 */
export function getLastEpisodeTime(first: number, total: number) {
    return getEpisodeTime(first, total)
}

/**
 * 判断番剧当前更新状态
 * - 即将更新：首集未播
 * - 连载中：在首尾之间
 * - 已完结：超过最后一集播出时间
 *
 * @param totalEpisode 总集数
 * @param firstEpisodeTimestamp 首集播出时间戳
 * @param now 当前时间戳
 * @returns 更新状态枚举值
 */
export function getAnimeStatus(
    totalEpisode: number,
    firstEpisodeTimestamp: number,
    now: number = Date.now()
) {
    const nowDay = dayjs(now)
    const first = dayjs(firstEpisodeTimestamp)
    const last = getLastEpisodeTime(firstEpisodeTimestamp, totalEpisode)

    if (nowDay.isBefore(first)) {
        return EStatus.toBeUpdated
    }

    if (nowDay.isAfter(last) || nowDay.isSame(last)) {
        return EStatus.completed
    }

    return EStatus.serializing
}

/**
 * 获取当前已更新集数
 * - 即将更新：0
 * - 已完结：totalEpisode
 * - 连载中：根据时间差推导
 *
 * 边界范围：0 <= result <= totalEpisode
 *
 * @param totalEpisode 总集数
 * @param firstEpisodeTimestamp 首集播出时间戳
 * @param now 当前时间戳
 * @returns 已更新集数
 */
export function getAiredEpisodeCount(
    totalEpisode: number,
    firstEpisodeTimestamp: number,
    now: number = Date.now()
) {
    const nowDay = dayjs(now)
    const first = dayjs(firstEpisodeTimestamp)
    const last = getLastEpisodeTime(firstEpisodeTimestamp, totalEpisode)

    if (nowDay.isBefore(first)) return 0
    if (nowDay.isAfter(last) || nowDay.isSame(last)) return totalEpisode

    const diffDays = nowDay.diff(first, 'day')
    const count = Math.floor(diffDays / EPISODE_INTERVAL_DAYS) + 1

    return Math.max(0, Math.min(totalEpisode, count))
}

/**
 * 判断番剧是否在本周有更新
 * - 本周范围：周一 ~ 周日（dayjs week）
 * - 只要任意一集落在本周范围内即为 true
 *
 * @param totalEpisode 总集数
 * @param firstEpisodeTimestamp 首集播出时间戳
 * @param now 当前时间戳
 * @returns 是否本周更新
 */
export function isUpdatedInThisWeek(
    totalEpisode: number,
    firstEpisodeTimestamp: number,
    now: number = Date.now()
) {
    const nowDay = dayjs(now)

    const weekStart = nowDay.startOf('isoWeek')
    const weekEnd = nowDay.endOf('isoWeek')

    const first = dayjs(firstEpisodeTimestamp)

    const firstIndex = Math.max(
        1,
        weekStart.diff(first, 'day') / EPISODE_INTERVAL_DAYS + 1
    )

    const lastIndex = Math.min(
        totalEpisode,
        weekEnd.diff(first, 'day') / EPISODE_INTERVAL_DAYS + 1
    )

    return lastIndex >= 1 && firstIndex <= totalEpisode
}

/**
 * 获取番剧在本周“应该更新到的集数”
 *
 * 规则：
 * - 即将更新：1
 * - 连载中：根据本周结束时进度计算
 * - 已完结：totalEpisode
 * - 不在本周更新：抛错
 *
 * 边界：
 * - 1 <= result <= totalEpisode
 *
 * @param totalEpisode 总集数
 * @param firstEpisodeTimestamp 首集播出时间戳
 * @param status 当前状态
 * @param now 当前时间戳
 * @returns 本周应更新集数
 */
export function getExpectedEpisodeThisWeek(
    totalEpisode: number,
    firstEpisodeTimestamp: number,
    status: number,
    now: number = Date.now()
) {
    const nowDay = dayjs(now)

    const weekEnd = nowDay.endOf('isoWeek')

    // 不在本周更新
    if (!isUpdatedInThisWeek(totalEpisode, firstEpisodeTimestamp, now)) {
        throw new Error('该番剧本周不更新')
    }

    // 即将更新
    if (status === EStatus.toBeUpdated) {
        return 1
    }

    // 已完结
    if (status === EStatus.completed) {
        return totalEpisode
    }

    // 连载中：计算本周结束时已更新集数
    const endCount = getAiredEpisodeCount(
        totalEpisode,
        firstEpisodeTimestamp,
        weekEnd.valueOf()
    )

    return Math.max(1, Math.min(totalEpisode, endCount))
}

/**
 * 获取最后一集播出时间戳
 *
 * @param totalEpisode 总集数
 * @param firstEpisodeTimestamp 首集播出时间戳
 * @returns 最后一集播出时间戳
 */
export function getLastEpisodeTimestamp(
    totalEpisode: number,
    firstEpisodeTimestamp: number
) {
    return getLastEpisodeTime(firstEpisodeTimestamp, totalEpisode).valueOf()
}
