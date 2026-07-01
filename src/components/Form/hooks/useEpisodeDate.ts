import { useSelector } from '@tanstack/react-store'
import dayjs from 'dayjs'

import type { AnimeFormApi } from '../fields/types'

/**
 * 由「完结时间」反推「首播时间」显示值。
 * 算法与原 BaseForm.tsx getFirstEpisodeDateTime 完全一致：
 *   首播 = 完结 - (totalEpisode - 1) 周；totalEpisode<1 或无完结时间时返回 '-'。
 *
 * 仅订阅 totalEpisode + lastEpisodeYYYYMMDDHHmm，避免无关重渲染。
 */
export function useFirstEpisodeDisplay(form: AnimeFormApi): string {
    const totalEpisode = useSelector(form.store, (s) => s.values.totalEpisode)
    const lastEpisode = useSelector(form.store, (s) => s.values.lastEpisodeYYYYMMDDHHmm)
    if (totalEpisode < 1 || !lastEpisode) return '-'
    return dayjs(lastEpisode, 'YYYY-MM-DD HH:mm')
        .subtract(totalEpisode - 1, 'week')
        .format('YYYY-MM-DD HH:mm')
}

/**
 * 由「首播时间」推算「完结时间」显示值。
 * 算法与原 BaseForm.tsx getLastEpisodeDateTime 完全一致：
 *   完结 = 首播 + (totalEpisode - 1) 周；totalEpisode<1 或无首播时间时返回 '-'。
 *
 * 仅订阅 totalEpisode + firstEpisodeYYYYMMDDHHmm，避免无关重渲染。
 */
export function useLastEpisodeDisplay(form: AnimeFormApi): string {
    const totalEpisode = useSelector(form.store, (s) => s.values.totalEpisode)
    const firstEpisode = useSelector(form.store, (s) => s.values.firstEpisodeYYYYMMDDHHmm)
    if (totalEpisode < 1 || !firstEpisode) return '-'
    return dayjs(firstEpisode, 'YYYY-MM-DD HH:mm')
        .add(totalEpisode - 1, 'week')
        .format('YYYY-MM-DD HH:mm')
}
