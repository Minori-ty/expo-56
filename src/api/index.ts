import { eq } from 'drizzle-orm'
import type { DeepExpand } from 'types-tools'

import { db } from '@/db'
import { animeTable } from '@/db/schema'
import { EStatus } from '@/enums'
import { addCalendarEvents, deleteCalendarEvents } from '@/utils/calendar'
import { getAnimeStatus } from '@/utils/time'

import { addAnime, getAnimeById, updateAnimeById, type IUpdateAnimeByAnimeId, type TAddAnimeData } from './anime'

type THandleAddAnime = DeepExpand<Omit<TAddAnimeData, 'eventIds'>>

/**
 * 添加动漫归一化处理
 *
 * ⚠️ 时间戳约定：
 * - 入参 firstEpisodeTimestamp 为毫秒（来自表单 dayjs().valueOf() 或导入时 ×1000 转换）
 * - DB 存储为秒（firstSec = Math.floor(ms / 1000)）
 * - 导出 JSON 中为秒，重新导入时必须 ×1000 还原
 */
export async function handleAddAnime(animeData: THandleAddAnime) {
    return await db.transaction(async (tx) => {
        const { name, totalEpisode, firstEpisodeTimestamp, cover } = animeData
        // firstEpisodeTimestamp is ms from form, convert to seconds for DB
        const firstSec = Math.floor(firstEpisodeTimestamp / 1000)
        const status = getAnimeStatus(totalEpisode, firstEpisodeTimestamp)
        let eventIds: string[] = []
        if (status === EStatus.serializing || status === EStatus.toBeUpdated) {
            const ids = await addCalendarEvents({
                name,
                firstEpisodeTimestamp,
                totalEpisode,
            })
            if (ids) eventIds = ids
        }

        await addAnime(tx, {
            cover,
            name,
            firstEpisodeTimestamp: firstSec,
            totalEpisode,
            eventIds,
        })
    })
}

/**
 * 删除动漫归一化处理
 */
export async function handleDeleteAnime(animeId: number) {
    await db.transaction(async (tx) => {
        const result = await getAnimeById(tx, animeId)
        if (!result) return
        if (result.eventIds && result.eventIds.length > 0) {
            await deleteCalendarEvents(result.eventIds)
        }
        await tx.delete(animeTable).where(eq(animeTable.id, animeId))
        console.log('删除动漫成功')
    })
}

export async function handleUpdateAnimeById(data: DeepExpand<Omit<IUpdateAnimeByAnimeId, 'eventIds'>>) {
    return await db.transaction(async (tx) => {
        const result = await getAnimeById(tx, data.animeId)
        if (!result) {
            console.log('animeId对应的动漫不存在，就不更新数据了')
            return
        }
        const { name, cover, firstEpisodeTimestamp, totalEpisode } = data
        const firstSec = Math.floor(firstEpisodeTimestamp / 1000)
        const status = getAnimeStatus(totalEpisode, firstEpisodeTimestamp)
        const { eventIds } = result

        // 删除旧的日历事件
        if (eventIds && eventIds.length > 0) {
            await deleteCalendarEvents(eventIds)
        }

        let newEventIds: string[] = []
        if (status !== EStatus.completed) {
            const ids = await addCalendarEvents({
                name,
                firstEpisodeTimestamp,
                totalEpisode,
            })
            if (ids) newEventIds = ids
        }

        await updateAnimeById(tx, {
            animeId: data.animeId,
            eventIds: newEventIds,
            name,
            totalEpisode,
            cover,
            firstEpisodeTimestamp: firstSec,
        })

        console.log('更新动漫数据成功')
    })
}
