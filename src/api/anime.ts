import dayjs from 'dayjs'
import { and, eq, like, ne } from 'drizzle-orm'
import type { DeepExpand } from 'types-tools'

import { db } from '@/db'
import { animeTable } from '@/db/schema'
import { EWeekday } from '@/enums'
import { TTx } from '@/types'
import { getLastEpisodeTimestamp, getWeekday } from '@/utils/time'

export interface IAddAnimeData {
    name: string
    totalEpisode: number
    cover: string
    /** unix seconds for DB storage */
    firstEpisodeTimestamp: number
    eventIds?: string[]
}

export type TAddAnimeData = DeepExpand<{
    name: string
    totalEpisode: number
    cover: string
    firstEpisodeTimestamp: number
    eventIds: string[]
}>

const MS_PER_SEC = 1000

/**
 * 添加动漫
 */
export async function addAnime(tx: TTx, data: DeepExpand<IAddAnimeData>) {
    const result = await tx.insert(animeTable).values(data).returning()
    if (result.length === 0) {
        console.log('添加动漫失败')
        return
    }
    return parseAnimeData(result[0])
}

export interface IUpdateAnimeByAnimeId extends IAddAnimeData {
    animeId: number
}

/**
 * 根据id更新动漫数据
 */
export async function updateAnimeById(tx: TTx, data: DeepExpand<IUpdateAnimeByAnimeId>) {
    const result = await getAnimeById(tx, data.animeId)
    if (!result) {
        console.log('animeId对应的动漫不存在，就不更新数据了')
        return
    }
    const { name, cover, firstEpisodeTimestamp, totalEpisode, eventIds } = data
    await tx
        .update(animeTable)
        .set({
            name,
            cover,
            firstEpisodeTimestamp,
            totalEpisode,
            eventIds,
            updatedAt: dayjs().unix(),
        })
        .where(eq(animeTable.id, data.animeId))
}

export interface IAnime {
    id: number
    name: string
    totalEpisode: number
    cover: string
    updateWeekday: typeof EWeekday.valueType
    /** ms for use with time.ts functions */
    firstEpisodeTimestamp: number
    /** ms for use with time.ts functions */
    lastEpisodeTimestamp: number
    updateTimeHHmm: string
    eventIds: string[]
    createdAt: number
}

/**
 * 获取所有动漫列表
 */
export async function getAnimeList() {
    const animeList = await db.select().from(animeTable)
    return animeList
}

/**
 * 根据id查找动漫
 */
export async function getAnimeById(tx: TTx, id: number) {
    const result = await tx.select().from(animeTable).where(eq(animeTable.id, id))
    if (result.length === 0) {
        return
    }
    return result[0]
}

/**
 * 根据id查找动漫（对外使用）
 */
export async function handleGetAnimeById(id: number) {
    return db.transaction(async (tx) => {
        const data = await getAnimeById(tx, id)
        if (!data) return
        return parseAnimeData(data)
    })
}

/**
 * 给创建动漫用的，根据name查找动漫
 */
export async function getAnimeByName(name: string) {
    const result = await db.select().from(animeTable).where(eq(animeTable.name, name))
    if (result.length === 0) {
        return
    }
    return result[0]
}

/**
 * 模糊搜索
 */
export async function getAnimeListByName(keyword: string) {
    const result = await db
        .select()
        .from(animeTable)
        .where(like(animeTable.name, `%${keyword}%`))
    return result
}

/**
 * 给编辑动漫用的，根据name查找除了自身id外的动漫
 */
export async function getAnimeByNameExceptItself(name: string, id: number) {
    const result = await db
        .select()
        .from(animeTable)
        .where(and(eq(animeTable.name, name), ne(animeTable.id, id)))
    if (result.length === 0) {
        return
    }
    return result[0]
}

interface IParseAnimeData {
    id: number
    name: string
    totalEpisode: number
    cover: string
    createdAt: number
    /** unix seconds from DB */
    firstEpisodeTimestamp: number
    eventIds: string[]
}
/**
 * 将DB数据解析为动漫数据格式
 *
 * DB 存储的是 unix seconds，time.ts 使用 ms，这里做转换。
 */
export function parseAnimeData(data: IParseAnimeData): DeepExpand<IAnime> {
    const { id, name, totalEpisode, cover, firstEpisodeTimestamp: firstSec, eventIds, createdAt } = data
    // Convert seconds from DB to ms for time.ts
    const firstEpisodeTimestamp = firstSec * MS_PER_SEC
    const updateWeekday = getWeekday(firstEpisodeTimestamp)
    const updateTimeHHmm = dayjs(firstEpisodeTimestamp).format('YYYY-MM-DD HH:mm')
    const lastEpisodeTimestamp = getLastEpisodeTimestamp(totalEpisode, firstEpisodeTimestamp)

    return {
        id,
        name,
        totalEpisode,
        cover,
        updateWeekday,
        firstEpisodeTimestamp,
        lastEpisodeTimestamp,
        updateTimeHHmm,
        eventIds,
        createdAt,
    }
}
