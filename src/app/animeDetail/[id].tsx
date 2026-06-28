import { useMutation, useQuery } from '@tanstack/react-query'
import { type ClassValue } from 'clsx'
import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { debounce } from 'lodash-es'
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { StyleSheet } from 'react-native'
import DateTimePicker, {
    type CalendarComponents,
    type CalendarDay,
    type DateType,
    useDefaultStyles,
} from 'react-native-ui-datepicker'

import { handleGetAnimeById } from '@/api/anime'
import { addCalendarByAnimeId, deleteCalendarByAnimeId } from '@/api/calendar'
import Loading from '@/components/lottie/Loading'
import { CompactHeader } from '@/components/ui/CompactHeader'
import Icon from '@/components/ui/Icon'
import { db } from '@/db'
import 'dayjs/locale/zh-cn'

import { animeTable } from '@/db/schema'
import { EStatus, EWeekday } from '@/enums'
import { blurhash, themeColorPurple } from '@/styles'
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from '@/tw'
import { Image } from '@/tw/image'
import { cn } from '@/utils/cn'
import { queryClient } from '@/utils/react-query'
import { getAiredEpisodeCount, getAnimeStatus } from '@/utils/time'

interface IAnimeDetailContext {
    firstEpisodeTimestamp: number
    lastEpisodeTimestamp: number
    totalEpisode: number
}
const animeDetailContext = createContext<IAnimeDetailContext | null>(null)

const useAnimeDetailContext = () => {
    const ctx = useContext(animeDetailContext)
    if (!ctx) throw new Error('缺少provider')
    return ctx
}

function AnimeDetail() {
    const { id } = useLocalSearchParams<{ id: string }>()

    const navigation = useNavigation()
    const router = useRouter()

    const {
        data: anime = {
            id: -1,
            name: '',
            currentEpisode: 0,
            totalEpisode: 0,
            cover: '',
            updateWeekday: EWeekday.monday,
            firstEpisodeTimestamp: dayjs().valueOf(),
            lastEpisodeTimestamp: dayjs().valueOf(),
            status: EStatus.serializing,
            updateTimeHHmm: '',
        },
        isLoading,
    } = useQuery({
        queryKey: ['anime-detail', id],
        queryFn: () => handleGetAnimeById(Number(id)),
    })

    const { data, updatedAt } = useLiveQuery(
        db
            .select()
            .from(animeTable)
            .where(eq(animeTable.id, Number(id))),
    )

    const isCalendarLoading = useMemo(() => {
        return !updatedAt
    }, [updatedAt])

    const calendar = useMemo(() => {
        if (!data[0]) {
            return false
        }
        return data[0].eventIds && data[0].eventIds.length > 0 ? true : false
    }, [data])

    const [firstEpisodeYYYYMMDDHHmm, setFirstEpisodeYYYYMMDDHHmm] = useState<DateType>(
        anime.firstEpisodeTimestamp && dayjs().format('YYYY-MM-DD HH:mm'),
    )
    useEffect(() => {
        setFirstEpisodeYYYYMMDDHHmm(dayjs(anime.firstEpisodeTimestamp))
    }, [isLoading, anime])

    const handlePress = useCallback(() => {
        const debounceHandler = debounce(
            () => {
                router.push(`/editAnime/${anime.id}`)
            },
            300,
            {
                leading: true,
                trailing: false,
            },
        )

        debounceHandler()

        return () => debounceHandler.cancel()
    }, [router, anime.id])

    /** 添加订阅 */
    const { mutate: handleCreateAndBindCalendarMution, isPending: isHandleCreateAndBindCalendarMutionLoading } =
        useMutation({
            mutationFn: addCalendarByAnimeId,
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ['anime-calendar', id],
                })
                queryClient.invalidateQueries({
                    queryKey: ['settings-calendar'],
                })
            },
            onError: (err) => {
                alert(`创建日历失败 ${err}`)
            },
        })

    const handleSubscribe = useCallback(() => {
        const debounceHandler = debounce(
            () => {
                handleCreateAndBindCalendarMution(Number(id))
            },
            300,
            {
                leading: true,
                trailing: false,
            },
        )

        debounceHandler()

        return () => debounceHandler.cancel()
    }, [id, handleCreateAndBindCalendarMution])

    /** 删除订阅 */
    const { mutate: handleClearCalendarByAnimeIdMution, isPending: isHandleClearCalendarByAnimeIdMutionLoading } =
        useMutation({
            mutationFn: deleteCalendarByAnimeId,
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: ['anime-calendar', id],
                })
                queryClient.invalidateQueries({
                    queryKey: ['settings-calendar'],
                })
            },
            onError: () => {},
        })

    const handleUnsubscribe = useCallback(() => {
        const debounceHandler = debounce(
            () => {
                handleClearCalendarByAnimeIdMution(Number(id))
            },
            300,
            {
                leading: true,
                trailing: false,
            },
        )

        debounceHandler()

        return () => debounceHandler.cancel()
    }, [id, handleClearCalendarByAnimeIdMution])

    const status = useMemo<typeof EStatus.valueType>(() => {
        return getAnimeStatus(anime.totalEpisode, anime.firstEpisodeTimestamp)
    }, [anime.firstEpisodeTimestamp, anime.totalEpisode, anime.lastEpisodeTimestamp])

    useLayoutEffect(() => {
        navigation.setOptions({
            title: '动漫详情',
            header: ({
                options,
                navigation,
            }: {
                options: Record<string, unknown>
                navigation: { goBack: () => void }
            }) => <CompactHeader options={options} back navigation={navigation} />,
            headerRight: () => {
                return (
                    <TouchableOpacity onPress={handlePress}>
                        <Icon name="Pencil" size={28} />
                    </TouchableOpacity>
                )
            },
        })
    }, [navigation, handlePress])

    const defaultStyles = useDefaultStyles()

    const currentEpisode = useMemo(() => {
        return getAiredEpisodeCount(anime.totalEpisode, anime.firstEpisodeTimestamp)
    }, [anime.firstEpisodeTimestamp, anime.totalEpisode])

    if (isLoading || !anime) {
        return <Loading />
    }

    const mapColor: Record<typeof EStatus.valueType, { bgColor: ClassValue; textColor: ClassValue }> = {
        [EStatus.completed]: {
            bgColor: 'bg-red-100',
            textColor: 'text-red-900',
        },
        [EStatus.serializing]: {
            bgColor: 'bg-green-100',
            textColor: 'text-green-900',
        },
        [EStatus.toBeUpdated]: {
            bgColor: 'bg-orange-100',
            textColor: 'text-orange-900',
        },
    }
    const components: CalendarComponents = {
        Day,
    }

    function onRefetch() {
        queryClient.invalidateQueries({
            queryKey: ['anime-calendar', id],
        })
        queryClient.invalidateQueries({
            queryKey: ['anime-detail', id],
        })

        queryClient.invalidateQueries({ queryKey: ['update-anime-currentEpisode'] })
    }

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={onRefetch}
                        className="text-theme"
                        colors={[themeColorPurple]}
                    />
                }
            >
                <animeDetailContext.Provider
                    value={{
                        firstEpisodeTimestamp: anime.firstEpisodeTimestamp,
                        lastEpisodeTimestamp: anime.lastEpisodeTimestamp,
                        totalEpisode: anime.totalEpisode,
                    }}
                >
                    {/* Cover Image Section */}
                    <View className="bg-white">
                        <View className="flex-row p-6">
                            {/* Cover Image */}
                            <View className="mr-4">
                                <Image
                                    source={anime.cover}
                                    placeholder={{ blurhash }}
                                    contentFit="cover"
                                    transition={500}
                                    cachePolicy={'memory-disk'}
                                    style={styles.cover}
                                />
                                {/* Status Badge */}
                                <View
                                    className={cn(
                                        `absolute -top-2 -right-2 rounded-full px-2 py-1`,
                                        mapColor[getAnimeStatus(anime.totalEpisode, anime.firstEpisodeTimestamp)]
                                            .bgColor,
                                    )}
                                >
                                    <Text
                                        className={cn(
                                            `text-xs font-medium`,
                                            mapColor[getAnimeStatus(anime.totalEpisode, anime.firstEpisodeTimestamp)]
                                                .textColor,
                                        )}
                                    >
                                        {
                                            EStatus.raw(getAnimeStatus(anime.totalEpisode, anime.firstEpisodeTimestamp))
                                                .label
                                        }
                                    </Text>
                                </View>
                            </View>

                            {/* Basic Info */}
                            <View className="flex-1">
                                <Text className="mb-3 text-xl leading-6 font-bold text-gray-900">{anime.name}</Text>

                                {/* Progress Info */}
                                <View className="mb-4">
                                    <View className="mb-2 flex-row items-center justify-between">
                                        <Text className="text-sm text-gray-600">更新进度</Text>
                                        <Text className="text-sm font-medium text-blue-600">
                                            {currentEpisode} / {anime.totalEpisode} 集
                                        </Text>
                                    </View>
                                    <View className="h-2 overflow-hidden rounded-full bg-gray-200">
                                        <View
                                            className="h-full rounded-full bg-blue-500"
                                            style={{
                                                width: `${Math.round((currentEpisode / anime.totalEpisode) * 100)}%`,
                                            }}
                                        />
                                    </View>
                                    <Text className="mt-1 text-xs text-gray-500">
                                        完成度 {Math.round((currentEpisode / anime.totalEpisode) * 100)}%
                                    </Text>
                                </View>

                                {/* Quick Stats */}
                                <View className="flex-row justify-between">
                                    <View className="items-center">
                                        <Text className="text-lg font-bold text-blue-600">{anime.totalEpisode}</Text>
                                        <Text className="text-xs text-gray-500">总集数</Text>
                                    </View>
                                    <View className="items-center">
                                        <Text className="text-lg font-bold text-green-600">{currentEpisode}</Text>
                                        <Text className="text-xs text-gray-500">已更新</Text>
                                    </View>
                                    <View className="items-center">
                                        <Text className="text-lg font-bold text-orange-600">
                                            {EWeekday.raw(anime.updateWeekday).label}
                                        </Text>
                                        <Text className="text-xs text-gray-500">更新日</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Update Schedule */}
                    <View className="mt-2 bg-white p-6">
                        <Text className="mb-4 text-lg font-semibold text-gray-900">更新时间表</Text>

                        <View className="space-y-4">
                            <View className="flex-row items-center rounded-xl bg-blue-50 px-4 py-3">
                                <View className="mr-3 size-8 items-center justify-center rounded-full bg-blue-500">
                                    <Icon name="CalendarClock" size={14} className="text-white" />
                                </View>
                                <View className="flex-1">
                                    <Text className="font-medium text-gray-900">每周更新</Text>
                                    <Text className="text-sm text-gray-600">
                                        {EWeekday.raw(anime.updateWeekday).label}{' '}
                                        {dayjs(anime.firstEpisodeTimestamp).format('HH:mm')}
                                    </Text>
                                </View>
                            </View>

                            <View className="my-3 flex-row items-center rounded-xl bg-green-50 px-4 py-3">
                                <View className="mr-3 size-8 items-center justify-center rounded-full bg-green-500">
                                    <Icon name="Clock" size={14} className="text-white" />
                                </View>
                                <View className="flex-1">
                                    <Text className="font-medium text-gray-900">首播时间</Text>
                                    <Text className="text-sm text-gray-600">
                                        {dayjs(anime.firstEpisodeTimestamp).format('YYYY-MM-DD HH:mm')}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row items-center rounded-xl bg-orange-50 px-4 py-3">
                                <View className="mr-3 size-8 items-center justify-center rounded-full bg-orange-500">
                                    <Icon name="CalendarCheck" size={14} className="text-white" />
                                </View>
                                <View className="flex-1">
                                    <Text className="font-medium text-gray-900">完结时间</Text>
                                    <Text className="text-sm text-gray-600">
                                        {dayjs(anime.lastEpisodeTimestamp).format('YYYY-MM-DD HH:mm')}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Subscribe/Unsubscribe */}
                    {status !== EStatus.completed && !calendar && (
                        <View className="mt-2 bg-white p-6">
                            <TouchableOpacity
                                className={cn(
                                    'mt-3 flex-row items-center justify-center rounded-xl bg-green-500 py-4',
                                    isCalendarLoading && 'bg-gray-400',
                                )}
                                activeOpacity={0.5}
                                onPress={handleSubscribe}
                                disabled={isHandleCreateAndBindCalendarMutionLoading}
                            >
                                <Icon name="Bell" className="mr-2 text-white" size={20} />
                                <Text className="font-medium text-white">设置更新提醒</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {status !== EStatus.completed && calendar && (
                        <View className="mt-2 bg-white p-6">
                            <TouchableOpacity
                                className={cn(
                                    'mt-3 flex-row items-center justify-center rounded-xl bg-red-500 py-4',
                                    isCalendarLoading && 'bg-gray-400',
                                )}
                                activeOpacity={0.5}
                                onPress={handleUnsubscribe}
                                disabled={isHandleClearCalendarByAnimeIdMutionLoading}
                            >
                                <Icon name="BellOff" className="mr-2 text-white" size={20} />
                                <Text className="font-medium text-white">取消更新提醒</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View className="mt-2 mb-16 rounded-md bg-white px-10 py-5">
                        <DateTimePicker
                            styles={defaultStyles}
                            mode="single"
                            date={firstEpisodeYYYYMMDDHHmm}
                            onChange={(day) => {
                                setFirstEpisodeYYYYMMDDHHmm(day.date)
                            }}
                            firstDayOfWeek={1}
                            multiRangeMode
                            showOutsideDays
                            locale="zh"
                            components={components}
                        />
                        <View className="h-16 items-end">
                            {dayjs(firstEpisodeYYYYMMDDHHmm).format('YYYY-MM-DD') !== dayjs().format('YYYY-MM-DD') && (
                                <TouchableOpacity
                                    className="size-16 items-center justify-center rounded-full bg-blue-500 elevation-lg"
                                    onPress={() => setFirstEpisodeYYYYMMDDHHmm(dayjs())}
                                    activeOpacity={0.5}
                                >
                                    <Text className="text-3xl text-white">今</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </animeDetailContext.Provider>
            </ScrollView>
        </View>
    )
}

export default AnimeDetail

function Day(day: CalendarDay) {
    const { isSelected, isCurrentMonth, isToday } = day
    const { totalEpisode, firstEpisodeTimestamp } = useAnimeDetailContext()

    const episode = useMemo(() => {
        return checkEpisodeUpdate({
            date: day.date,
            totalEpisode,
            firstEpisodeYYYYMMDDHHmm: dayjs(firstEpisodeTimestamp).format('YYYY-MM-DD HH:mm'),
            currentEpisode: getAiredEpisodeCount(totalEpisode, firstEpisodeTimestamp),
        })
    }, [day.date, totalEpisode, firstEpisodeTimestamp])

    return (
        <View
            className={cn(
                'relative w-full flex-1 items-center rounded border border-transparent bg-white',
                isSelected && 'border border-blue-500',
                isCurrentMonth && isSelected && isToday && 'bg-blue-500',
            )}
        >
            <Text
                className={cn(
                    'top-2',
                    isSelected && isToday && 'text-white',
                    !isCurrentMonth && 'text-gray-200',
                    isCurrentMonth && !isSelected && isToday && 'text-blue-500',
                )}
            >
                {day.text}
            </Text>
            {
                <View className="absolute bottom-2 w-full">
                    <Text
                        className={cn(
                            'text-center',
                            !isCurrentMonth && 'text-gray-200',
                            isSelected && isToday && 'text-white',
                            isCurrentMonth && episode && 'text-orange-500',
                        )}
                        style={styles.episodeText}
                    >
                        {episode}
                    </Text>
                </View>
            }
        </View>
    )
}

interface ICheckEpisodeUpdate {
    firstEpisodeYYYYMMDDHHmm: string
    totalEpisode: number
    date: string
    currentEpisode: number
}
function checkEpisodeUpdate({ date, firstEpisodeYYYYMMDDHHmm, totalEpisode }: ICheckEpisodeUpdate): string {
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

const styles = StyleSheet.create({
    cover: {
        width: 128,
        height: 192,
        borderRadius: 12,
    },
    episodeText: {
        fontSize: 6,
    },
})
