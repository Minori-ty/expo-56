import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { animeTable } from '@/db/schema'
import { addCalendarEvents, deleteCalendarEvents } from '@/utils/calendar'

import { getAnimeById } from './anime'

/**
 * 为动漫添加日历事件（多个独立事件，每集一个）
 */
export async function addCalendarByAnimeId(animeId: number) {
    return await db.transaction(async (tx) => {
        const result = await getAnimeById(tx, animeId)
        if (!result) {
            console.log('该id对应的动漫不存在')
            return
        }
        const { name, firstEpisodeTimestamp, totalEpisode } = result
        const eventIds = await addCalendarEvents({
            name,
            firstEpisodeTimestamp: firstEpisodeTimestamp * 1000,
            totalEpisode,
        })
        if (!eventIds) {
            console.log('创建日历事件失败了，就不修改动漫数据了')
            return
        }

        await tx.update(animeTable).set({ eventIds }).where(eq(animeTable.id, animeId))
    })
}

/**
 * 删除动漫的所有日历事件
 *
 * 仅在系统日历事件真正删除成功后，才清空 DB 中的 eventIds。
 * 这样权限被拒时 eventIds 保留作为凭证，等权限恢复后可以重试清理。
 */
export async function deleteCalendarByAnimeId(animeId: number) {
    return await db.transaction(async (tx) => {
        const result = await getAnimeById(tx, animeId)
        if (!result) {
            console.log('该id对应的动漫不存在')
            return
        }

        if (!result.eventIds || result.eventIds.length === 0) {
            console.log('没有日历事件，有可能被用户主动删除了')
            return
        }

        const deleted = await deleteCalendarEvents(result.eventIds)
        if (!deleted) {
            console.log('删除日历事件失败（权限被拒或其他原因），保留 DB 中的 eventIds 记录')
            throw new Error('删除日历事件失败')
        }
        await tx.update(animeTable).set({ eventIds: [] }).where(eq(animeTable.id, animeId))
    })
}

/**
 * 批量删除日历事件
 */
export async function deleteCalendarByAnimeIds(animeIds: number[]) {
    return await Promise.all(animeIds.map(deleteCalendarByAnimeId))
}
