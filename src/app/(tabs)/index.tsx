import dayjs from 'dayjs'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { router } from 'expo-router'
import { debounce } from 'lodash-es'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { StyleSheet } from 'react-native'
import { SceneMap, TabBar, TabView } from 'react-native-tab-view'

import { parseAnimeData } from '@/api/anime'
import Empty from '@/components/lottie/Empty'
import Loading from '@/components/lottie/Loading'
import { db } from '@/db'
import { animeTable } from '@/db/schema'
import { EStatus, EWeekday } from '@/enums'
import { blurhash, themeColorPurple } from '@/styles'
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from '@/tw'
import { Image } from '@/tw/image'
import type { TAnimeList } from '@/types'
import {
    getAiredEpisodeCount,
    getAnimeStatus,
    getMondayTimestampInThisWeek,
    getSundayTimestampInThisWeek,
    isCurrentWeekdayUpdateTimePassed,
} from '@/utils/time'

interface IScheduleContext {
    list: TAnimeList
    isLoading: boolean
}

const scheduleContext = createContext<IScheduleContext | null>(null)

const useSchedule = () => {
    const ctx = useContext(scheduleContext)
    if (!ctx) throw new Error('缺少provider')
    return ctx
}

// enum-plus v3: toMenu() removed, iterate items directly
const routes = EWeekday.items.map((item) => {
    return {
        key: item.key,
        title: item.label,
    }
})

// Build SceneMap dynamically from EWeekday.items so keys match route keys
const scenes: Record<string, () => React.JSX.Element> = {}
for (const item of EWeekday.items) {
    scenes[item.key] = () => <TabViewComponent updateWeekday={item.value} />
}
const renderScene = SceneMap(scenes)
export default function Index() {
    const [index, setIndex] = useState<number>(dayjs().isoWeekday() - 1)

    const { data, updatedAt } = useLiveQuery(db.select().from(animeTable))
    const list = useMemo(() => {
        return data
            .map((item) => parseAnimeData(item))
            .filter((item) => {
                const status = getAnimeStatus(item.totalEpisode, item.firstEpisodeTimestamp)
                if (status === EStatus.serializing) {
                    return true
                }
                if (status === EStatus.completed) {
                    return item.lastEpisodeTimestamp > getMondayTimestampInThisWeek()
                }
                if (status === EStatus.toBeUpdated) {
                    return item.firstEpisodeTimestamp < getSundayTimestampInThisWeek()
                }
                return false
            })
    }, [data])

    const isLoading = useMemo(() => {
        return !updatedAt
    }, [updatedAt])

    return (
        <scheduleContext.Provider value={{ list, isLoading }}>
            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                overScrollMode={'auto'}
                renderTabBar={(props) => (
                    <TabBar
                        {...props}
                        scrollEnabled
                        activeColor={themeColorPurple}
                        inactiveColor="#9E9E9E"
                        tabStyle={styles.tabBarTab}
                        style={styles.tabBar}
                    />
                )}
            />
        </scheduleContext.Provider>
    )
}

function TabViewComponent({ updateWeekday }: { updateWeekday: typeof EWeekday.valueType }) {
    const { list, isLoading } = useSchedule()
    const [timestamp, setTimestamp] = useState(dayjs().unix())
    const animeList = list.filter((item) => dayjs(item.firstEpisodeTimestamp).isoWeekday() === updateWeekday)

    function refetch() {
        setTimestamp(dayjs().unix())
    }
    if (animeList.length === 0) {
        return (
            <ScrollView
                contentContainerStyle={styles.center}
                key={timestamp}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={refetch}
                        className="text-theme"
                        colors={[themeColorPurple]}
                    />
                }
            >
                {isLoading ? <Loading /> : <Empty />}
            </ScrollView>
        )
    }

    const mapSchedule: Record<string, TAnimeList> = {}
    animeList.forEach((item) => {
        const HHmm = dayjs(item.firstEpisodeTimestamp).format('HH:mm')
        if (mapSchedule[HHmm]) {
            mapSchedule[HHmm].push(item)
        } else {
            mapSchedule[HHmm] = [item]
        }
    })

    const updateTimeHHmmList = Object.keys(mapSchedule)
    const sortedTimes = updateTimeHHmmList.sort((a, b) => {
        const timeA = dayjs(`${dayjs().format('YYYY-MM-DD')} ${a}`).unix()
        const timeB = dayjs(`${dayjs().format('YYYY-MM-DD')} ${b}`).unix()
        return timeA - timeB
    })

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={isLoading}
                    onRefresh={refetch}
                    className="text-theme"
                    colors={[themeColorPurple]}
                />
            }
        >
            {sortedTimes.map((time, index) => {
                return <AnimeCardItem time={time} animeList={mapSchedule[time]} key={index} />
            })}
        </ScrollView>
    )
}
interface IAnimeCardItemProps {
    time: string
    animeList: TAnimeList
}

function AnimeCardItem({ time, animeList }: IAnimeCardItemProps) {
    const handleToAnimeDetail = useCallback((id: number) => {
        const debounceHandler = debounce(
            () => {
                router.push(`/animeDetail/${id}`)
            },
            300,
            {
                leading: true,
                trailing: false,
            },
        )
        debounceHandler()
        return () => debounceHandler.cancel()
    }, [])
    return (
        <View className="my-2 flex-row">
            <View className="w-16 items-center justify-start">
                <Text className="font-medium">{time}</Text>
            </View>
            <View className="size-full">
                {animeList.map((item) => {
                    return (
                        <TouchableOpacity
                            key={item.id}
                            activeOpacity={0.5}
                            onPress={() => handleToAnimeDetail(item.id)}
                            className="mb-3 h-28 flex-1 flex-row"
                        >
                            <Image
                                source={item.cover}
                                placeholder={{ blurhash }}
                                contentFit="cover"
                                transition={500}
                                cachePolicy={'memory-disk'}
                                style={styles.cover}
                            />
                            <View className="flex-1">
                                <Text className="font-black">{item.name}</Text>
                                <EpisodeTip
                                    firstEpisodeTimestamp={item.firstEpisodeTimestamp}
                                    totalEpisode={item.totalEpisode}
                                />
                                {getAnimeStatus(item.totalEpisode, item.firstEpisodeTimestamp) ===
                                    EStatus.completed && <Text className="mt-2 text-sm text-[#fb7299]">已完结🎉</Text>}
                            </View>
                        </TouchableOpacity>
                    )
                })}
            </View>
        </View>
    )
}

interface IEpisodeTipProps {
    firstEpisodeTimestamp: number
    totalEpisode: number
}
function EpisodeTip({ firstEpisodeTimestamp, totalEpisode }: IEpisodeTipProps) {
    if (isCurrentWeekdayUpdateTimePassed(dayjs(firstEpisodeTimestamp).format('YYYY-MM-DD HH:mm'))) {
        return (
            <Text className="mt-3 text-sm text-[#fb7299]">
                更新到 第{getAiredEpisodeCount(totalEpisode, firstEpisodeTimestamp)}集
            </Text>
        )
    }
    return (
        <Text className="mt-3 text-sm text-[#9E9E9E]">
            即将更新 第{getAiredEpisodeCount(totalEpisode, firstEpisodeTimestamp) + 1}集
        </Text>
    )
}

const styles = StyleSheet.create({
    tabBar: {
        elevation: 0,
        shadowOpacity: 0,
        shadowRadius: 0,
        shadowOffset: { height: 0, width: 0 },
        borderBottomWidth: 0,
        backgroundColor: '#fff',
    },
    tabBarTab: {
        width: 80,
        backgroundColor: '#fff',
    },
    cover: {
        width: 70,
        borderRadius: 5,
        marginRight: 10,
        height: 70 * 1.5,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
})
