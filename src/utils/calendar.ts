import { eq } from 'drizzle-orm'
import { AlarmMethod, ExpoCalendarEvent, getCalendars, listEvents } from 'expo-calendar'
import { Alert, Linking, Platform } from 'react-native'
import Toast from 'react-native-toast-message'

import { db } from '@/db'
import { animeTable, settingsTable } from '@/db/schema'
import { EStatus } from '@/enums'
import { getCalendarPermission } from '@/permissions'

import { getAnimeStatus, getAiredEpisodeCount, getEpisodeTime } from './time'

/**
 * 获取可修改的默认日历
 */
async function getWritableCalendar() {
    const calendars = await getCalendars()
    return calendars.find((cal) => cal.allowsModifications) ?? null
}

/**
 * 批量删除日历事件
 *
 * 权限被拒时与 addCalendarEvents 保持一致的用户反馈。
 *
 * @returns true 表示全部删除成功；false 表示有失败（含权限被拒）
 */
export async function deleteCalendarEvents(eventIds: string[]) {
    if (!eventIds || eventIds.length === 0) return false

    const { granted, canAskAgain } = await getCalendarPermission()
    if (!granted) {
        if (!canAskAgain) {
            Alert.alert(
                '日历权限已关闭',
                '日历权限已被永久拒绝，无法删除番剧更新提醒。\n\n请前往系统设置开启日历权限。',
                [
                    { text: '取消', style: 'cancel' },
                    {
                        text: '去设置',
                        onPress: () => {
                            if (Platform.OS === 'ios') {
                                Linking.openURL('app-settings:')
                            } else {
                                Linking.openSettings()
                            }
                        },
                    },
                ],
            )
        } else {
            Toast.show({
                type: 'info',
                text1: '未授权日历权限',
                text2: '无法删除日历事件，可在系统设置中开启',
                visibilityTime: 3000,
            })
        }
        return false
    }

    let allSuccess = true
    for (const id of eventIds) {
        try {
            const event = await ExpoCalendarEvent.get(id)
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

    const { granted } = await getCalendarPermission()
    if (!granted) return

    const calendars = await getCalendars()
    const writableCalendars = calendars.filter((cal) => cal.allowsModifications)
    if (writableCalendars.length === 0) return

    // 搜索范围：前后 5 年
    const now = new Date()
    const startDate = new Date(now.getFullYear() - 5, 0, 1)
    const endDate = new Date(now.getFullYear() + 5, 11, 31)

    let events: ExpoCalendarEvent[]
    try {
        events = await listEvents(writableCalendars, startDate, endDate)
    } catch (error) {
        console.log('获取日历事件失败:', error)
        return
    }

    const orphanedEvents = events.filter((e) => CALENDAR_EVENT_TITLE_PATTERN.test(e.title))

    if (orphanedEvents.length > 0) {
        let deletedCount = 0
        for (const event of orphanedEvents) {
            try {
                const calendarEvent = await ExpoCalendarEvent.get(event.id)
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

/**
 * 清理已过期的日历事件（每集的开始时间已过）。
 *
 * 每次 app 启动后执行（由 (tabs)/_layout.tsx 调用）。
 * 遍历所有有 eventIds 的动漫，逐事件检查是否过期，过期则删除并更新 DB。
 */
export async function cleanupExpiredCalendarEvents() {
    const { granted } = await getCalendarPermission()
    if (!granted) return

    const now = Date.now()

    // 读取所有有日历事件的动漫
    const animeList = await db.select().from(animeTable)
    let totalDeleted = 0

    for (const anime of animeList) {
        const eventIds = anime.eventIds
        if (!eventIds || eventIds.length === 0) continue

        const expiredIds: string[] = []

        for (const eventId of eventIds) {
            try {
                const event = await ExpoCalendarEvent.get(eventId)
                const eventEndDate = event.endDate
                const endTime = eventEndDate
                    ? typeof eventEndDate === 'string'
                        ? new Date(eventEndDate).getTime()
                        : eventEndDate.getTime()
                    : 0
                if (endTime <= now) {
                    await event.delete()
                    expiredIds.push(eventId)
                    totalDeleted++
                    console.log(`清理过期日历事件: ${event.title}`)
                }
            } catch {
                // 事件已被删除或不存在，也记为需清理
                expiredIds.push(eventId)
            }
        }

        if (expiredIds.length > 0) {
            const remainingIds = eventIds.filter((id) => !expiredIds.includes(id))
            await db.update(animeTable).set({ eventIds: remainingIds }).where(eq(animeTable.id, anime.id))
        }
    }

    if (totalDeleted > 0) {
        console.log(`过期日历事件清理完成，共删除 ${totalDeleted} 个`)
    }
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
 * 日历权限被拒时：
 * - 可再问（canAskAgain=true）→ 返回 null，由上层 Toast 提示
 * - 永久拒绝（canAskAgain=false）→ 弹窗引导去系统设置，返回 null
 *
 * @returns eventId 数组；如果失败（含权限被拒）返回 null
 */
export async function addCalendarEvents({
    name,
    firstEpisodeTimestamp,
    totalEpisode,
}: ICreateCalendarEventsProps): Promise<string[] | null> {
    const { granted, canAskAgain } = await getCalendarPermission()
    if (!granted) {
        if (!canAskAgain) {
            Alert.alert(
                '日历权限已关闭',
                '日历权限已被永久拒绝，无法创建番剧更新提醒。\n\n请前往系统设置开启日历权限。',
                [
                    { text: '取消', style: 'cancel' },
                    {
                        text: '去设置',
                        onPress: () => {
                            if (Platform.OS === 'ios') {
                                Linking.openURL('app-settings:')
                            } else {
                                Linking.openSettings()
                            }
                        },
                    },
                ],
            )
        } else {
            Toast.show({
                type: 'info',
                text1: '未授权日历权限',
                text2: '不会创建番剧更新提醒，可在系统设置中开启',
                visibilityTime: 3000,
            })
        }
        // 无论哪种拒绝，都不阻止动漫数据保存，仅跳过日历事件创建
        return null
    }

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
                        method: AlarmMethod.ALERT,
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
