import { BottomSheetModal, BottomSheetView } from '@expo/ui/community/bottom-sheet'
import { useMutation } from '@tanstack/react-query'
import { type ClassValue } from 'clsx'
import dayjs from 'dayjs'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { Enum } from 'enum-plus'
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'
import { Image } from 'expo-image'
import { useNavigation, useRouter } from 'expo-router'
import React, { createContext, memo, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
    BackHandler,
    Dimensions,
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'

import { handleDeleteAnime } from '@/api'
import { parseAnimeData } from '@/api/anime'
import Loading from '@/components/lottie/Loading'
import { useModal } from '@/components/Modal'
import TransparentLoading from '@/components/TransparentLoading'
import Icon from '@/components/ui/Icon'
import { db } from '@/db'
import { animeTable } from '@/db/schema'
import { EStatus } from '@/enums'
import { useNavigationLock } from '@/hooks/useNavigationLock'
import { blurhash, themeColorPurple } from '@/styles'
import { TAnimeList } from '@/types'
import { cn } from '@/utils/cn'
import { queryClient } from '@/utils/react-query'
import { getAiredEpisodeCount, getAnimeStatus } from '@/utils/time'

const GAP = 10

interface IMyFollowsContext {
    isLoading: boolean
    handleDeleteAnimeMutation: (id: number) => void
}
const myFollowsContext = createContext<IMyFollowsContext | null>(null)

const useMyFollowsContext = () => {
    const ctx = useContext(myFollowsContext)
    if (!ctx) throw new Error('缺少provider')
    return ctx
}

const EStatusList = Enum({
    all: {
        value: 0,
        label: '全部',
    },
    completed: {
        value: 1,
        label: '已完结',
    },
    serializing: {
        value: 2,
        label: '连载中',
    },
    toBeUpdated: {
        value: 3,
        label: '即将更新',
    },
})

const ESortList = Enum({
    positive: {
        value: 1,
        label: '正序',
    },
    reverse: {
        value: 2,
        label: '倒序',
    },
})

export default function MyFollows() {
    const router = useRouter()
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const [status, setStatus] = useState<typeof EStatusList.valueType>(EStatusList.all)
    const [sort, setSort] = useState<typeof ESortList.valueType>(ESortList.positive)

    const { data, updatedAt } = useLiveQuery(db.select().from(animeTable))
    const list = useMemo(() => {
        return data
            .map((item) => parseAnimeData(item))
            .filter((item) => {
                if (status === EStatusList.all) {
                    return true
                }
                return getAnimeStatus(item.totalEpisode, item.firstEpisodeTimestamp) === status
            })
            .sort((a, b) => {
                if (sort === ESortList.positive) {
                    return a.createdAt - b.createdAt || a.id - b.id
                } else {
                    return b.createdAt - a.createdAt || b.id - a.id
                }
            })
    }, [data, status, sort])

    const isLoading = useMemo(() => {
        return !updatedAt
    }, [updatedAt])

    const { mutate: handleDeleteAnimeMutation, isPending: isDeleting } = useMutation({
        mutationFn: handleDeleteAnime,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['search'],
            })
        },
    })

    // 删除时禁止安卓返回键
    useEffect(() => {
        if (!isDeleting) return
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => true)
        return () => subscription.remove()
    }, [isDeleting])

    const navigate = useNavigationLock()

    const navigation = useNavigation()
    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: '我的追番',
            headerRight: () => (
                <View className="flex-row items-center gap-4 pr-2">
                    <TouchableOpacity onPress={() => navigate(() => router.push('/search'))}>
                        <Icon name="Search" size={24} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => bottomSheetModalRef.current?.present()}>
                        <Icon name="Settings2" size={24} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigate(() => router.push('/addAnime'))}>
                        <Icon name="Plus" size={34} />
                    </TouchableOpacity>
                </View>
            ),
        })
    }, [navigation, router, navigate])

    return (
        <>
            <myFollowsContext.Provider value={{ isLoading, handleDeleteAnimeMutation }}>
                {list.length > 0 ? <AnimeContainer list={list} /> : <Empty />}
            </myFollowsContext.Provider>

            {isDeleting ? (
                <View className="absolute inset-0 z-50 bg-white/70">
                    <TransparentLoading />
                </View>
            ) : null}

            <BottomSheetModal ref={bottomSheetModalRef} enablePanDownToClose>
                <BottomSheetView style={styles.sheetContent}>
                    <Text className="my-2 pl-4 text-sm font-medium text-gray-500">筛选状态</Text>
                    <View className="overflow-hidden rounded-2xl bg-white">
                        {EStatusList.items.map((item) => {
                            return <SelectItem item={item} status={status} setStatus={setStatus} key={item.key} />
                        })}
                    </View>
                    <Text className="my-2 pl-4 text-sm font-medium text-gray-500">排序</Text>
                    <View className="overflow-hidden rounded-2xl bg-white">
                        {ESortList.items.map((item) => {
                            return <SortItem item={item} sort={sort} setSort={setSort} key={item.key} />
                        })}
                    </View>
                </BottomSheetView>
            </BottomSheetModal>
        </>
    )
}

interface IAnimeContainerProps {
    list: TAnimeList
}
const AnimeContainer = memo(function AnimeContainer({ list }: IAnimeContainerProps) {
    const { isLoading } = useMyFollowsContext()
    const [timestamp, setTimestamp] = useState(dayjs().unix())

    function onRefetch() {
        console.log(dayjs().unix())
        setTimestamp(dayjs().unix())
    }
    return (
        <FlatList
            className="bg-white pb-4"
            data={list}
            extraData={timestamp}
            keyExtractor={(item) => item.id.toString()}
            numColumns={3}
            columnWrapperStyle={{ gap: GAP }}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: GAP, paddingHorizontal: GAP, paddingBottom: 20 }}
            renderItem={({ item }) => <AnimeContainerItem data={item} timestamp={timestamp} />}
            refreshControl={
                <RefreshControl
                    refreshing={isLoading}
                    onRefresh={onRefetch}
                    className="text-theme"
                    colors={[themeColorPurple]}
                />
            }
        />
    )
})

interface IAnimeContainerItemProps {
    data: TAnimeList[number]
    timestamp: number
}
const AnimeContainerItem = memo(function AnimeContainerItem({ data }: IAnimeContainerItemProps) {
    const modal = useModal()
    const router = useRouter()
    const { handleDeleteAnimeMutation } = useMyFollowsContext()
    const navigate = useNavigationLock()

    return (
        <Pressable
            onPress={() => navigate(() => router.push(`/animeDetail/${data.id}`))}
            onLongPress={() => {
                impactAsync(ImpactFeedbackStyle.Medium)
                modal.show({
                    body: <Text className="text-sm">你确定要删除 &quot;{data.name}&quot; 吗?</Text>,
                    onConfirm: () => handleDeleteAnimeMutation(data.id),
                })
            }}
            delayLongPress={300}
            style={{ width: (Dimensions.get('window').width - GAP * 4) / 3 }}
        >
            <View
                className={cn(
                    'overflow-hidden rounded-lg',
                    // oxlint-disable-next-line tailwindcss/no-unknown-classes
                    `h-[${((Dimensions.get('window').width - GAP * 4) / 3) * 1.5}px]`,
                )}
            >
                <Image
                    source={data.cover}
                    placeholder={{ blurhash }}
                    contentFit="cover"
                    cachePolicy="disk"
                    style={styles.cover}
                />
                <UpdateLabel status={getAnimeStatus(data.totalEpisode, data.firstEpisodeTimestamp)} />
            </View>
            <Text numberOfLines={1} className="font-semibold">
                {data.name}
            </Text>
            <Text className="mt-1 text-sm text-gray-500">
                更新 第{getAiredEpisodeCount(data.totalEpisode, data.firstEpisodeTimestamp)}集
            </Text>
        </Pressable>
    )
})

function Empty() {
    const { isLoading } = useMyFollowsContext()
    const [timestamp, setTimestamp] = useState(dayjs().unix())
    function refetch() {
        setTimestamp(dayjs().unix())
    }
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
            className="bg-white"
        >
            {isLoading ? <Loading /> : <Text>暂无动漫数据，请先到右上角添加动漫</Text>}
        </ScrollView>
    )
}

interface IUpdateLabelProps {
    status: typeof EStatus.valueType
}
function UpdateLabel({ status }: IUpdateLabelProps) {
    return (
        <View
            className={cn('absolute bottom-0 left-0 h-8 items-center justify-center rounded-tr-lg px-2')}
            style={{ backgroundColor: EStatus.raw(status).color }}
        >
            <Text className="truncate text-white">{EStatus.raw(status).label}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    cover: {
        width: (Dimensions.get('window').width - GAP * 4) / 3,
        height: ((Dimensions.get('window').width - GAP * 4) / 3) * 1.5,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    sheetContent: {
        height: 400,
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
})

interface ISelectItem {
    item: (typeof EStatusList.items)[number]
    status: typeof EStatusList.valueType
    setStatus: React.Dispatch<React.SetStateAction<typeof EStatusList.valueType>>
}

function SelectItem({ item, status, setStatus }: ISelectItem) {
    const [bgColor, setBgColor] = useState<ClassValue>('bg-white')
    return (
        <TouchableOpacity
            className={cn('flex-row items-center justify-between px-4 py-3', bgColor)}
            key={item.key}
            onPress={() => setStatus(item.value)}
            activeOpacity={1}
            onPressIn={() => {
                if (status === item.value) return
                setBgColor('bg-gray-300')
            }}
            onPressOut={() => {
                if (status === item.value) return
                setBgColor('bg-white')
            }}
        >
            <Text className={cn('text-lg', status === item.value && 'text-blue-500')}>{item.label}</Text>
            {status === item.value && <Icon name="Check" size={22} className="text-blue-500" />}
        </TouchableOpacity>
    )
}

interface ISortItem {
    item: (typeof ESortList.items)[number]
    sort: typeof ESortList.valueType
    setSort: React.Dispatch<React.SetStateAction<typeof ESortList.valueType>>
}
function SortItem({ item, sort, setSort }: ISortItem) {
    const [bgColor, setBgColor] = useState<ClassValue>('bg-white')
    return (
        <TouchableOpacity
            className={cn('flex-row items-center justify-between px-4 py-3', bgColor)}
            key={item.key}
            onPress={() => setSort(item.value)}
            activeOpacity={1}
            onPressIn={() => {
                if (sort === item.value) return
                setBgColor('bg-gray-300')
            }}
            onPressOut={() => {
                if (sort === item.value) return
                setBgColor('bg-white')
            }}
        >
            <Text className={cn('text-lg', sort === item.value && 'text-blue-500')}>{item.label}</Text>
            {sort === item.value && <Icon name="Check" size={22} className="text-blue-500" />}
        </TouchableOpacity>
    )
}
