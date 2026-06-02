import { EStatus } from '@/enums'
import dayjs from 'dayjs'

const INTERVAL = 7 * 24 * 60 * 60 * 1000

/**
 * 获取第 n 集的播出时间
 *
 * 基于固定 7 天更新周期计算，每集时间按线性递增：
 * first + (n - 1) * 7天
 *
 * @param firstEpisodeTimestamp 首集播出时间戳
 * @param episodeIndex 第几集（从 1 开始）
 * @returns dayjs 时间对象
 */
export function getEpisodeTime(firstEpisodeTimestamp: number, episodeIndex: number) {
    return dayjs(firstEpisodeTimestamp + (episodeIndex - 1) * INTERVAL)
}

/**
 * 获取最后一集的播出时间
 *
 * 等价于第 totalEpisode 集的播出时间
 *
 * @param firstEpisodeTimestamp 首集播出时间戳
 * @param totalEpisode 总集数
 * @returns dayjs 时间对象
 */
export function getLastEpisodeTime(firstEpisodeTimestamp: number, totalEpisode: number) {
    return getEpisodeTime(firstEpisodeTimestamp, totalEpisode)
}

/**
 * 判断番剧当前更新状态
 *
 * 状态规则：
 * - 未开播：当前时间早于首播时间
 * - 连载中：当前集数 < 总集数
 * - 已完结：当前集数 >= 总集数
 *
 * 更新周期：固定 7 天一集
 *
 * @param totalEpisode 总集数
 * @param firstEpisodeTimestamp 首集播出时间戳
 * @param now 当前时间戳
 * @returns 更新状态枚举
 */
export function getAnimeStatus(
    totalEpisode: number,
    firstEpisodeTimestamp: number,
    now: number = Date.now()
) {
    if (now < firstEpisodeTimestamp) {
        return EStatus.toBeUpdated
    }

    const aired = Math.floor((now - firstEpisodeTimestamp) / INTERVAL) + 1

    if (aired >= totalEpisode) {
        return EStatus.completed
    }

    return EStatus.serializing
}

/**
 * 获取当前已更新集数
 *
 * 计算方式：
 * - 以首播时间为起点
 * - 每 7 天更新一集
 * - 向下取整计算已播集数
 *
 * 边界：
 * - 未开播：0
 * - 最大不超过 totalEpisode
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
    if (now < firstEpisodeTimestamp) return 0

    const diffDays = dayjs(now).diff(firstEpisodeTimestamp, 'day')

    const count = Math.floor(diffDays / 7) + 1

    return Math.max(0, Math.min(totalEpisode, count))
}

/**
 * 番剧在当前自然周是否会更新
 *
 * 自然周定义：
 * 周一 00:00:00 ~ 周日 23:59:59
 *
 * 规则：
 * - 本周有任意一集播出（过去或未来） => true
 * - 已完结但在本周有最后一集 => true
 * - 很久之前完结且本周无更新 => false
 * - 下周/下下周更新 => false
 */
export function isUpdatedInThisWeek(
    totalEpisode: number,
    firstEpisodeTimestamp: number,
    now: number = Date.now()
) {
    if (now < firstEpisodeTimestamp) return false
    const weekStart = dayjs(now).startOf('isoWeek')
    const weekEnd = dayjs(now).endOf('isoWeek')

    const first = dayjs(firstEpisodeTimestamp)

    // 本周可能涉及的 episode index 区间（核心）
    const startIndex =
        Math.floor(weekStart.diff(first, 'millisecond') / INTERVAL) + 1

    const endIndex =
        Math.floor(weekEnd.diff(first, 'millisecond') / INTERVAL) + 1

    // 裁剪到合法集数范围
    const from = Math.max(1, startIndex)
    const to = Math.min(totalEpisode, endIndex)

    // 没有任何有效集数落在本周
    if (from > to) return false

    // 本质：本周是否存在至少一集
    return true
}

/**
 * 获取番剧在当前周期“应展示”的最新集数
 *
 * 规则：
 * - 未开播：返回 1
 * - 已完结：返回 totalEpisode
 * - 连载中：返回当前已播集数
 *
 * @param totalEpisode 总集数
 * @param firstEpisodeTimestamp 首集播出时间戳
 * @param status 当前番剧状态
 * @param now 当前时间戳
 * @returns 当前应展示的集数
 */
export function getExpectedEpisodeThisWeek(
    totalEpisode: number,
    firstEpisodeTimestamp: number,
    status: number,
    now: number = Date.now()
) {
    if (now < firstEpisodeTimestamp) {
        return 1
    }

    if (status === EStatus.completed) {
        return totalEpisode
    }

    const count = getAiredEpisodeCount(totalEpisode, firstEpisodeTimestamp, now)

    return Math.max(1, Math.min(totalEpisode, count))
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
