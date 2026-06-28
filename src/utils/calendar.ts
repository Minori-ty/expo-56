import { EStatus } from '@/enums'
import { getCalendarPermission } from '@/permissions'
import dayjs from 'dayjs'
import * as Calendar from 'expo-calendar'
import { getAnimeStatus, getAiredEpisodeCount, getEpisodeTime } from './time'

/**
 * 删除单个日历事件
 */
export async function deleteCalendarEvent(eventId: string) {
    const granted = await getCalendarPermission()
    if (!granted) return false

    try {
        await Calendar.deleteEventAsync(eventId)
        console.log('删除日历成功:', eventId)
        return true
    } catch {
        console.log('删除日历失败:', eventId)
        return false
    }
}

/**
 * 批量删除日历事件
 */
export async function deleteCalendarEvents(eventIds: string[]) {
    if (!eventIds || eventIds.length === 0) return false

    const granted = await getCalendarPermission()
    if (!granted) return false

    const calendars = await Calendar.getCalendarsAsync()
    const defaultCalendar = calendars.find(cal => cal.allowsModifications)

    if (!defaultCalendar) {
        console.log('没有找到可修改的默认日历')
        return false
    }

    let allSuccess = true
    for (const id of eventIds) {
        try {
            await Calendar.deleteEventAsync(id)
            console.log('删除日历成功:', id)
        } catch {
            console.log('删除日历失败:', id)
            allSuccess = false
        }
    }

    return allSuccess
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

    const calendars = await Calendar.getCalendarsAsync()
    const defaultCalendar = calendars.find(cal => cal.allowsModifications)

    if (!defaultCalendar) {
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
            const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
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
            eventIds.push(eventId)
            console.log(`创建日历成功: ${name} 第 ${ep} 集`)
        } catch (error) {
            console.log(`创建日历失败: ${name} 第 ${ep} 集`, error)
        }
    }

    if (eventIds.length === 0) return null

    return eventIds
}

/**
 * 查找日历事件是否存在
 */
export async function getCalendarEventByEventId(eventId: string) {
    const granted = await getCalendarPermission()
    if (!granted) return false

    try {
        await Calendar.getEventAsync(eventId)
        return true
    } catch {
        console.log('没有找到日历事件')
        return false
    }
}
