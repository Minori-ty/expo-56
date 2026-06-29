import { eq } from 'drizzle-orm'
import * as Calendar from 'expo-calendar'

import { db } from '@/db'
import { settingsTable } from '@/db/schema'
import { EStatus } from '@/enums'
import { getCalendarPermission } from '@/permissions'

import { getAnimeStatus, getAiredEpisodeCount, getEpisodeTime } from './time'

/**
 * 获取可修改的默认日历
 */
async function getWritableCalendar() {
    const calendars = await Calendar.getCalendars()
    return calendars.find((cal) => cal.allowsModifications) ?? null
}

/**
 * 批量删除日历事件
 */
export async function deleteCalendarEvents(eventIds: string[]) {
    if (!eventIds || eventIds.length === 0) return false

    const granted = await getCalendarPermission()
    if (!granted) return false

    let allSuccess = true
    for (const id of eventIds) {
        try {
            const event = await Calendar.ExpoCalendarEvent.get(id)
            await event.delete()
            console.log('删除日历成功:', id)
        } catch {
            console.log('删除日历失败:', id)
            allSuccess = false
        }
    }

    return allSuccess
}

/** 日历事件标题匹配： "XXX 第 N 集更新!" */
const CALENDAR_EVENT_TITLE_PATTERN = /^.+ 第 \d+ 集更新!$/

const CLEANUP_FLAG_KEY = 'calendar_cleanup_done'

/**
 * 清理孤立的日历事件（用户卸载 app 前未清理的事件）。
 *
 * 仅在首次启动时执行一次（通过 settings 表记录）。
 * 检索所有可修改日历中的事件，删除标题匹配 `"XXX 第 N 集更新!"` 的孤立事件。
 * 静默调用，失败不提示用户。
 */
export async function cleanupOrphanedCalendarEvents() {
    // 已执行过清理，跳过
    const rows = await db.select().from(settingsTable).where(eq(settingsTable.key, CLEANUP_FLAG_KEY))
    if (rows.length > 0) return

    const granted = await getCalendarPermission()
    if (!granted) return

    const calendars = await Calendar.getCalendars()
    const writableCalendars = calendars.filter((cal) => cal.allowsModifications)
    if (writableCalendars.length === 0) return

    // 搜索范围：前后 5 年
    const now = new Date()
    const startDate = new Date(now.getFullYear() - 5, 0, 1)
    const endDate = new Date(now.getFullYear() + 5, 11, 31)

    let events: Calendar.ExpoCalendarEvent[]
    try {
        events = await Calendar.listEvents(writableCalendars, startDate, endDate)
    } catch (error) {
        console.log('获取日历事件失败:', error)
        return
    }

    const orphanedEvents = events.filter((e) => CALENDAR_EVENT_TITLE_PATTERN.test(e.title))

    if (orphanedEvents.length > 0) {
        let deletedCount = 0
        for (const event of orphanedEvents) {
            try {
                const calendarEvent = await Calendar.ExpoCalendarEvent.get(event.id)
                await calendarEvent.delete()
                deletedCount++
                console.log(`清理孤立日历事件: ${event.title}`)
            } catch {
                console.log(`清理失败: ${event.title}`)
            }
        }
        console.log(`清理完成，共删除 ${deletedCount} 个孤立日历事件`)
    }

    // 写入标记，避免再次扫描
    await db.insert(settingsTable).values({ key: CLEANUP_FLAG_KEY, value: '1' })
}

interface ICreateCalendarEventsProps {
    name: string
    firstEpisodeTimestamp: number
    totalEpisode: number
}

/**
 * 创建多个独立的日历事件（每集一个，title 包含集数信息）
 *
 * 与旧版不同：不再创建单条重复事件，而是为每一集创建独立事件，
 * title 格式为 "xxx 第 N 集更新!"
 *
 * @returns eventId 数组；如果失败返回 null
 */
export async function addCalendarEvents({
    name,
    firstEpisodeTimestamp,
    totalEpisode,
}: ICreateCalendarEventsProps): Promise<string[] | null> {
    const granted = await getCalendarPermission()
    if (!granted) return null

    const calendar = await getWritableCalendar()
    if (!calendar) {
        console.log('没有找到可修改的默认日历')
        return null
    }

    const status = getAnimeStatus(totalEpisode, firstEpisodeTimestamp)
    if (status === EStatus.completed) {
        console.log('动漫已完成，不创建日历事件')
        return null
    }

    const currentEpisode = getAiredEpisodeCount(totalEpisode, firstEpisodeTimestamp)

    // 需要创建的集数范围：从下一集到最后一集
    const startEpisode = status === EStatus.toBeUpdated ? 1 : currentEpisode + 1
    const endEpisode = totalEpisode

    if (startEpisode > endEpisode) {
        return null
    }

    const eventIds: string[] = []

    for (let ep = startEpisode; ep <= endEpisode; ep++) {
        const episodeTime = getEpisodeTime(firstEpisodeTimestamp, ep)
        const startDate = episodeTime.toDate()
        const endDate = episodeTime.add(1, 'minute').toDate()

        try {
            const event = await calendar.createEvent({
                title: `${name} 第 ${ep} 集更新!`,
                startDate,
                endDate,
                timeZone: 'Asia/Shanghai',
                alarms: [
                    {
                        relativeOffset: 0,
                        method: Calendar.AlarmMethod.ALERT,
                    },
                ],
            })
            eventIds.push(event.id)
            console.log(`创建日历成功: ${name} 第 ${ep} 集`)
        } catch (error) {
            console.log(`创建日历失败: ${name} 第 ${ep} 集`, error)
        }
    }

    if (eventIds.length === 0) return null

    return eventIds
}
