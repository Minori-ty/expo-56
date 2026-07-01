import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'

import { EStatus } from '@/enums'

dayjs.extend(isoWeek)
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
export function getAnimeStatus(totalEpisode: number, firstEpisodeTimestamp: number, now: number = Date.now()) {
    if (now < firstEpisodeTimestamp) {
        return EStatus.toBeUpdated
    }

    if (Math.floor((now - firstEpisodeTimestamp) / INTERVAL) + 1 >= totalEpisode) {
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
export function getAiredEpisodeCount(totalEpisode: number, firstEpisodeTimestamp: number, now: number = Date.now()) {
    if (now < firstEpisodeTimestamp) return 0

    const diffDays = dayjs(now).diff(firstEpisodeTimestamp, 'day')

    return Math.max(0, Math.min(totalEpisode, Math.floor(diffDays / 7) + 1))
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
 *
 * @param totalEpisode 番剧总集数
 * @param firstEpisodeTimestamp 第一集播出时间戳（毫秒）
 * @param now 当前时间戳（毫秒），默认取当前时间
 * @returns 本周是否存在至少一集更新
 */
export function isUpdatedInThisWeek(totalEpisode: number, firstEpisodeTimestamp: number, now: number = Date.now()) {
    if (now < firstEpisodeTimestamp) return false
    const weekStart = dayjs(now).startOf('isoWeek')
    const weekEnd = dayjs(now).endOf('isoWeek')

    const first = dayjs(firstEpisodeTimestamp)

    // 本周可能涉及的 episode index 区间（核心）
    const startIndex = Math.floor(weekStart.diff(first, 'millisecond') / INTERVAL) + 1

    const endIndex = Math.floor(weekEnd.diff(first, 'millisecond') / INTERVAL) + 1

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
    now: number = Date.now(),
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
export function getLastEpisodeTimestamp(totalEpisode: number, firstEpisodeTimestamp: number) {
    return getLastEpisodeTime(firstEpisodeTimestamp, totalEpisode).valueOf()
}

/**
 * 根据完结时间反推首集播出时间戳
 *
 * 公式：首集 = 完结时间 - (totalEpisode - 1) * 7 天，秒清零。
 * 与 getLastEpisodeTimestamp 互为逆运算，供「已完结」状态提交时统一调用，
 * 避免该公式在 addAnime / editAnime 各自重复书写。
 *
 * @param totalEpisode 总集数
 * @param lastEpisodeTimestamp 完结时间戳（毫秒）
 * @returns 首集播出时间戳（毫秒）
 */
export function getFirstEpisodeTimestampFromLast(totalEpisode: number, lastEpisodeTimestamp: number) {
    return dayjs(lastEpisodeTimestamp).subtract(totalEpisode - 1, 'week').second(0).valueOf()
}

/**
 * 获取本周一 00:00:00 的时间戳
 */
export function getMondayTimestampInThisWeek(now: number = Date.now()) {
    return dayjs(now).startOf('isoWeek').valueOf()
}

/**
 * 获取本周日 23:59:59 的时间戳
 */
export function getSundayTimestampInThisWeek(now: number = Date.now()) {
    return dayjs(now).endOf('isoWeek').valueOf()
}

/**
 * 判断当前周的更新日对应的更新时间是否已经过了
 *
 * @param dateStr 格式 'YYYY-MM-DD HH:mm'
 * @returns true 表示已过，false 表示未过
 */
export function isCurrentWeekdayUpdateTimePassed(dateStr: string) {
    const target = dayjs(dateStr)
    const now = dayjs()
    return now.isAfter(target)
}

/**
 * 根据当前集数和更新信息反推首集播出时间戳
 *
 * 公式：首集 = 本周更新日 - (currentEpisode - 1) * 7 天
 *
 * @param currentEpisode 当前已播集数
 * @param updateTimeHHmm 更新时间（HH:mm 格式）
 * @param updateWeekday ISO 星期（1-7）
 * @returns 首集播出时间戳
 */
/**
 * 根据表单数据计算首集播出时间戳（毫秒）
 *
 * 替代 addAnime / editAnime 中重复的 3向 if/else 分支：
 *   - serializing  → getFirstEpisodeTimestamp
 *   - completed    → getFirstEpisodeTimestampFromLast
 *   - toBeUpdated  → dayjs(firstEpisodeYYYYMMDDHHmm)
 *
 * 调用方保证传入的 status 分支字段已通过表单校验、非空且合法。
 *
 * @returns 首集播出时间戳（毫秒）
 */
export function computeFirstEpisodeTimestamp(data: {
    status: number
    currentEpisode?: number
    updateTimeHHmm?: string
    updateWeekday?: number | string
    totalEpisode?: number
    lastEpisodeYYYYMMDDHHmm?: string
    firstEpisodeYYYYMMDDHHmm?: string
}): number {
    if (data.status === EStatus.serializing) {
        if (data.currentEpisode === undefined || data.updateTimeHHmm === undefined || data.updateWeekday === undefined) {
            throw new Error('serializing 状态下 currentEpisode、updateTimeHHmm、updateWeekday 必填')
        }
        return getFirstEpisodeTimestamp({
            currentEpisode: data.currentEpisode,
            updateTimeHHmm: data.updateTimeHHmm,
            updateWeekday: Number(data.updateWeekday),
        })
    }
    if (data.status === EStatus.completed) {
        if (data.totalEpisode === undefined || data.lastEpisodeYYYYMMDDHHmm === undefined) {
            throw new Error('completed 状态下 totalEpisode、lastEpisodeYYYYMMDDHHmm 必填')
        }
        return getFirstEpisodeTimestampFromLast(
            data.totalEpisode,
            dayjs(data.lastEpisodeYYYYMMDDHHmm, 'YYYY-MM-DD HH:mm').valueOf(),
        )
    }
    // toBeUpdated
    if (data.firstEpisodeYYYYMMDDHHmm === undefined) {
        throw new Error('toBeUpdated 状态下 firstEpisodeYYYYMMDDHHmm 必填')
    }
    return dayjs(data.firstEpisodeYYYYMMDDHHmm, 'YYYY-MM-DD HH:mm').second(0).valueOf()
}

export function getFirstEpisodeTimestamp({
    currentEpisode,
    updateTimeHHmm,
    updateWeekday,
}: {
    currentEpisode: number
    updateTimeHHmm: string
    updateWeekday: number
}) {
    const now = dayjs()
    let updateDay = now
        .isoWeekday(updateWeekday)
        .hour(dayjs(updateTimeHHmm).hour())
        .minute(dayjs(updateTimeHHmm).minute())
        .second(0)

    // 如果本周更新日还没到，说明 currentEpisode 是上周播的，
    // 需要用上周的更新日来反推首集时间，否则首集会晚一周
    if (updateDay.isAfter(now)) {
        updateDay = updateDay.subtract(1, 'week')
    }

    return updateDay.subtract(currentEpisode - 1, 'week').valueOf()
}
