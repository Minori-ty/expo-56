import { EStatus } from '@/enums'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'

// ─── Plugins ─────────────────────────────────────────────────────────────────

dayjs.extend(isoWeek)

// ─── Constants ───────────────────────────────────────────────────────────────

export const WEEK_SECONDS = 7 * 24 * 60 * 60

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * 番剧时间计算所需的最小参数。
 * 从 `animeTable` 中选取 `firstEpisodeTimestamp` 和 `totalEpisode` 即可。
 */
export interface AnimeTimingInput {
    /** 第一集播出的 unix 时间戳（秒） */
    firstEpisodeTimestamp: number
    /** 总集数 */
    totalEpisode: number
}

/** 更新状态值：1=已完结 2=连载中 3=即将更新 */
export type StatusValue = typeof EStatus.valueType

/** getStatus + getAiredEpisodes + getCurrentEpisode 的聚合结果 */
export interface AnimeTimingResult extends AnimeTimingInput {
    status: StatusValue
    airedEpisodes: number
    currentEpisode: number
    lastEpisodeTimestamp: number
    isUpdatingThisWeek: boolean
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

/** 统一 now 参数为 unix 秒：dayjs 对象取其 unix()，数字视为已为秒直接返回 */
function toUnixSeconds(now?: number | dayjs.Dayjs): number {
    if (now === undefined) return dayjs().unix()
    if (typeof now === 'number') return now
    return now.unix()
}

/** 获取第 N 集（1-based）的播出时间戳 */
function getEpisodeTimestamp(input: AnimeTimingInput, episode: number): number {
    return input.firstEpisodeTimestamp + (episode - 1) * WEEK_SECONDS
}

/**
 * 获取番剧在其播出 weekday 的"基准时间"（当天 00:00 对应的那集播出时刻的时间部分）。
 * 用于计算"本周该 weekday 对应的那集"。
 */
function getThisWeekEpisodeNumber(input: AnimeTimingInput, nowUnix: number): number {
    const first = dayjs.unix(input.firstEpisodeTimestamp)
    const targetWeekday = first.day() // 0=Sun … 6=Sat

    // 本周该 weekday 的时刻（保留首集的时分秒）
    const thisWeekAir = dayjs
        .unix(nowUnix)
        .isoWeekday(targetWeekday === 0 ? 7 : targetWeekday) // isoWeekday: 1=Mon … 7=Sun
        .hour(first.hour())
        .minute(first.minute())
        .second(first.second())

    const airUnix = thisWeekAir.unix()
    const episode = Math.floor((airUnix - input.firstEpisodeTimestamp) / WEEK_SECONDS) + 1
    return episode
}

// ─── 1. getStatus ────────────────────────────────────────────────────────────

/**
 * 判断番剧的更新状态。
 * @param now — unix 秒数或 dayjs 对象；省略则用当前时间
 * @returns `1` 已完结、`2` 连载中、`3` 即将更新
 */
export function getStatus(input: AnimeTimingInput, now?: number | dayjs.Dayjs): StatusValue {
    const nowUnix = toUnixSeconds(now)

    if (nowUnix < input.firstEpisodeTimestamp) {
        return EStatus.toBeUpdated satisfies StatusValue
    }

    const lastEpTime = getEpisodeTimestamp(input, input.totalEpisode)
    if (nowUnix > lastEpTime) {
        return EStatus.completed satisfies StatusValue
    }

    return EStatus.serializing satisfies StatusValue
}

// ─── 2. getAiredEpisodes ─────────────────────────────────────────────────────

/**
 * 获取番剧到当前时间已更新的集数。
 *
 * - 即将更新 → 0
 * - 已完结 → totalEpisode
 * - 连载中 → 按每周一集计算已播数量，上限 totalEpisode
 */
export function getAiredEpisodes(input: AnimeTimingInput, now?: number | dayjs.Dayjs): number {
    const status = getStatus(input, now)

    if (status === (EStatus.toBeUpdated satisfies StatusValue)) return 0
    if (status === (EStatus.completed satisfies StatusValue)) return input.totalEpisode

    const nowUnix = toUnixSeconds(now)
    const elapsed = nowUnix - input.firstEpisodeTimestamp
    const aired = Math.floor(elapsed / WEEK_SECONDS) + 1
    return Math.min(aired, input.totalEpisode)
}

// ─── 3. isUpdatingThisWeek ───────────────────────────────────────────────────

/**
 * 判断番剧是否在本周更新。
 *
 * - 已完结但 **本周内完结最后一集** → `true`
 * - 即将更新但 **本周内更新第一集** → `true`
 * - 连载中且本周有一集播出 → `true`
 */
export function isUpdatingThisWeek(input: AnimeTimingInput, now?: number | dayjs.Dayjs): boolean {
    const nowUnix = toUnixSeconds(now)
    const episode = getThisWeekEpisodeNumber(input, nowUnix)
    return episode >= 1 && episode <= input.totalEpisode
}

// ─── 4. getCurrentEpisode ────────────────────────────────────────────────────

/**
 * 获取番剧到当前时间"应该更新到的集数"。
 *
 * - 已完结 → 始终返回 `totalEpisode`
 * - 即将更新且本周首播 → `1`
 * - 即将更新但未到首播周 → `0`
 * - 连载中 → 已播集数（当前时间已播出的集数）
 */
export function getCurrentEpisode(input: AnimeTimingInput, now?: number | dayjs.Dayjs): number {
    const status = getStatus(input, now)
    const nowUnix = toUnixSeconds(now)

    if (status === (EStatus.completed satisfies StatusValue)) {
        return input.totalEpisode
    }

    if (status === (EStatus.toBeUpdated satisfies StatusValue)) {
        return isUpdatingThisWeek(input, nowUnix) ? 1 : 0
    }

    return getAiredEpisodes(input, nowUnix)
}

// ─── 5. getLastEpisodeTimestamp ──────────────────────────────────────────────

/**
 * 获取番剧最后一集（或即将播出的第一集）的播出时间戳（unix 秒）。
 *
 * - 已完结 → 最终集播出时间
 * - 连载中 → 最近已播出一集的播出时间；若一集都还没播则为首集时间
 * - 即将更新 → 即将播出的第一集时间
 */
export function getLastEpisodeTimestamp(input: AnimeTimingInput, now?: number | dayjs.Dayjs): number {
    const status = getStatus(input, now)

    if (status === (EStatus.completed satisfies StatusValue)) {
        return getEpisodeTimestamp(input, input.totalEpisode)
    }

    if (status === (EStatus.toBeUpdated satisfies StatusValue)) {
        return input.firstEpisodeTimestamp
    }

    const aired = getAiredEpisodes(input, now)
    if (aired === 0) return input.firstEpisodeTimestamp
    return getEpisodeTimestamp(input, aired)
}

// ─── 6. getAllTiming (聚合) ──────────────────────────────────────────────────

/**
 * 一次性获取所有时间相关计算结果。
 */
export function getAllTiming(input: AnimeTimingInput, now?: number | dayjs.Dayjs): AnimeTimingResult {
    const nowUnix = toUnixSeconds(now)
    const status = getStatus(input, nowUnix)
    const airedEpisodes = getAiredEpisodes(input, nowUnix)
    const currentEpisode = getCurrentEpisode(input, nowUnix)

    return {
        ...input,
        status,
        airedEpisodes,
        currentEpisode,
        lastEpisodeTimestamp: getLastEpisodeTimestamp(input, nowUnix),
        isUpdatingThisWeek: isUpdatingThisWeek(input, nowUnix),
    }
}
