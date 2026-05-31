import { db } from '@/db'
import { animeTable } from '@/db/schema'
import { EStatus } from '@/enums'
import { getCalendarPermission } from '@/permissions'
import { getAiredEpisodes, getStatus, WEEK_SECONDS } from '@/utils/time'
import { eq } from 'drizzle-orm'
import { ExpoCalendar, ExpoCalendarEvent, getDefaultCalendarSync } from 'expo-calendar'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AddAnimeInput {
    name: string
    totalEpisode: number
    cover: string
    firstEpisodeTimestamp: number
}

export type UpdateAnimeInput = AddAnimeInput

// ─── Calendar Helpers ────────────────────────────────────────────────────────

/** 确保有日历权限，无权限则抛出 */
async function ensureCalendarPermission(): Promise<void> {
    const granted = await getCalendarPermission()
    if (!granted) throw new Error('没有日历权限，无法操作日历')
}

/** 获取默认日历 ID */
function getDefaultCalendarId(): string {
    const calendar = getDefaultCalendarSync()
    if (!calendar?.id) throw new Error('无法获取默认日历')
    return calendar.id
}

/**
 * 为一组集数创建日历事件。
 * @returns 创建成功的 eventId 数组
 */
async function createCalendarEvents(
    name: string,
    firstEpisodeTimestamp: number,
    startEpisode: number,
    endEpisode: number,
    calendarId: string,
): Promise<string[]> {
    const ids: string[] = []
    const calendar = await ExpoCalendar.get(calendarId)
    for (let n = startEpisode; n <= endEpisode; n++) {
        const eventTime = firstEpisodeTimestamp + (n - 1) * WEEK_SECONDS
        const event = await calendar.createEvent({
            title: `${name} 即将更新 第${n}集`,
            startDate: new Date(eventTime * 1000),
            endDate: new Date((eventTime + 3600) * 1000),
            alarms: [{ relativeOffset: -30 }],
        })
        ids.push(event.id)
    }
    return ids
}

/**
 * 安全删除日历事件：先检查事件是否存在，存在才删除。
 * 对不存在的 event 静默跳过（可能已被用户手动删除）。
 */
async function safeDeleteCalendarEvents(eventIds: string[]): Promise<void> {
    for (const id of eventIds) {
        try {
            const event = await ExpoCalendarEvent.get(id)
            await event.delete()
        } catch {
            // 事件不存在 → 跳过
        }
    }
}

/**
 * 计算需要创建日历事件的起始集数。
 * - 已完结 → 返回 totalEpisode + 1（无需创建）
 * - 连载中 + 已更新 → 从下周（aired + 1）开始
 * - 连载中 + 未更新 / 即将更新 → 从第 1 集开始
 */
function calcStartEpisode(firstEpisodeTimestamp: number, totalEpisode: number): number {
    const status = getStatus({ firstEpisodeTimestamp, totalEpisode })

    if (status === EStatus.completed) {
        return totalEpisode + 1
    }

    const aired = getAiredEpisodes({ firstEpisodeTimestamp, totalEpisode })
    return aired > 0 ? aired + 1 : 1
}

// ─── 1. addAnime ─────────────────────────────────────────────────────────────

/**
 * 添加动漫。
 * - 已完结：仅写入表，不创建日历事件
 * - 连载中 / 即将更新：先建日历事件，拿到 eventIds 后写入表
 */
export async function addAnime(input: AddAnimeInput): Promise<void> {
    const { name, totalEpisode, cover, firstEpisodeTimestamp } = input

    // 提前计算日历事件（事务外，因为日历操作不支持 DB 事务回滚）
    let eventIds: string[] = []
    const status = getStatus({ firstEpisodeTimestamp, totalEpisode })

    if (status !== EStatus.completed) {
        await ensureCalendarPermission()
        const calendarId = getDefaultCalendarId()
        const startEp = calcStartEpisode(firstEpisodeTimestamp, totalEpisode)

        if (startEp <= totalEpisode) {
            eventIds = await createCalendarEvents(name, firstEpisodeTimestamp, startEp, totalEpisode, calendarId)
        }
    }

    // DB 写入
    await db.transaction(async (tx) => {
        await tx.insert(animeTable).values({
            name,
            totalEpisode,
            cover,
            firstEpisodeTimestamp,
            eventIds,
        })
    })
}

// ─── 2. updateAnime ──────────────────────────────────────────────────────────

/**
 * 更新动漫（仅更新表数据，不改日历事件）。
 */
export async function updateAnime(id: number, input: UpdateAnimeInput): Promise<void> {
    await db.transaction(async (tx) => {
        await tx
            .update(animeTable)
            .set({
                name: input.name,
                totalEpisode: input.totalEpisode,
                cover: input.cover,
                firstEpisodeTimestamp: input.firstEpisodeTimestamp,
                updatedAt: Math.floor(Date.now() / 1000),
            })
            .where(eq(animeTable.id, id))
    })
}

// ─── 3. deleteAnime ──────────────────────────────────────────────────────────

/**
 * 删除动漫：先删关联日历事件，再删表记录。
 */
export async function deleteAnime(id: number): Promise<void> {
    // 先读取 eventIds（事务外）
    const [record] = await db.select({ eventIds: animeTable.eventIds }).from(animeTable).where(eq(animeTable.id, id))

    if (!record) return

    // 删除日历事件（事务外）
    if (record.eventIds?.length) {
        await ensureCalendarPermission()
        await safeDeleteCalendarEvents(record.eventIds)
    }

    // 删表记录
    await db.transaction(async (tx) => {
        await tx.delete(animeTable).where(eq(animeTable.id, id))
    })
}

// ─── 4. clearCalendarEvents ─────────────────────────────────────────────────

/**
 * 清空指定动漫的日历事件，并将 eventIds 置空。
 */
export async function clearCalendarEvents(animeId: number): Promise<void> {
    const [record] = await db
        .select({ eventIds: animeTable.eventIds })
        .from(animeTable)
        .where(eq(animeTable.id, animeId))

    if (!record?.eventIds?.length) return

    await ensureCalendarPermission()
    await safeDeleteCalendarEvents(record.eventIds)

    await db.transaction(async (tx) => {
        await tx.update(animeTable).set({ eventIds: [] }).where(eq(animeTable.id, animeId))
    })
}

// ─── 5. addCalendarEvents ───────────────────────────────────────────────────

/**
 * 为指定动漫创建日历事件。
 * 逻辑同 addAnime：
 * - 连载中：从还没更新的集数开始到全部
 * - 即将更新：从第一集开始到全部
 * - 新事件 ID 追加到已有 eventIds 中
 */
export async function addCalendarEvents(animeId: number): Promise<void> {
    const [record] = await db
        .select({
            name: animeTable.name,
            firstEpisodeTimestamp: animeTable.firstEpisodeTimestamp,
            totalEpisode: animeTable.totalEpisode,
            eventIds: animeTable.eventIds,
        })
        .from(animeTable)
        .where(eq(animeTable.id, animeId))

    if (!record) throw new Error('动漫不存在')

    await ensureCalendarPermission()
    const calendarId = getDefaultCalendarId()

    const startEp = calcStartEpisode(record.firstEpisodeTimestamp, record.totalEpisode)

    if (startEp > record.totalEpisode) return // 没有需要创建的

    const newEventIds = await createCalendarEvents(
        record.name,
        record.firstEpisodeTimestamp,
        startEp,
        record.totalEpisode,
        calendarId,
    )

    // 合并并写入
    const merged = [...(record.eventIds ?? []), ...newEventIds]
    await db.transaction(async (tx) => {
        await tx.update(animeTable).set({ eventIds: merged }).where(eq(animeTable.id, animeId))
    })
}
