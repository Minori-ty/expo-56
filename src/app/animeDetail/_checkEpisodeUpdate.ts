import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

export interface ICheckEpisodeUpdate {
    firstEpisodeYYYYMMDDHHmm: string
    totalEpisode: number
    date: string
    currentEpisode: number
}

/**
 * 判断给定日期对应的番剧集数（每 7 天一集）。
 *
 * 从 animeDetail/[id].tsx 抽出，仅做纯数据计算，方便单测。
 *
 * @returns 命中集数时返回 "第N集"；不在播出周或已完结返回空串。
 */
export function checkEpisodeUpdate({ date, firstEpisodeYYYYMMDDHHmm, totalEpisode }: ICheckEpisodeUpdate): string {
    const firstDate = dayjs(firstEpisodeYYYYMMDDHHmm, 'YYYYMMDDHHmm')
    const targetDate = dayjs(date)

    const diffInWeeks = targetDate.startOf('day').diff(firstDate.startOf('day'), 'week')

    if (diffInWeeks < 0 || diffInWeeks >= totalEpisode) {
        return ''
    }

    const expectedUpdateDate = firstDate.add(diffInWeeks, 'week')

    if (targetDate.isSame(expectedUpdateDate, 'day')) {
        return `第${diffInWeeks + 1}集`
    }

    return ''
}
