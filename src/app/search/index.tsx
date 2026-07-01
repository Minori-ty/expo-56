import { Enum } from 'enum-plus'
import { Image } from 'expo-image'
import { router, useNavigation } from 'expo-router'
import { useLayoutEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

import { getAnimeListByName } from '@/api/anime'
import Empty from '@/components/lottie/Empty'
import Icon from '@/components/ui/Icon'
import { animeTable } from '@/db/schema'
import { EStatus } from '@/enums'
import { blurhash } from '@/styles'
import { cn } from '@/utils/cn'
import { getAiredEpisodeCount, getAnimeStatus } from '@/utils/time'

export default function Search() {
    const navigation = useNavigation()
    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        })
    }, [navigation])

    const [keyword, setKeyword] = useState('')
    const [searched, setSearched] = useState(false)
    type AnimeRow = (typeof animeTable)['$inferSelect']
    const [list, setList] = useState<AnimeRow[]>([])

    async function handleSearch() {
        if (!keyword) return
        setSearched(true)
        const result = await getAnimeListByName(keyword)
        setList(result)
    }

    const EStatusColor = Enum({
        completed: {
            value: EStatus.completed,
            color: 'text-completed',
        },
        serializing: {
            value: EStatus.serializing,
            color: 'text-serializing',
        },
        toBeUpdated: {
            value: EStatus.toBeUpdated,
            color: 'text-toBeUpdated',
        },
    })

    return (
        <ScrollView className="flex-1 bg-white px-6" contentContainerStyle={{ flexGrow: 1 }}>
            <View className="my-5 flex-row items-center gap-2">
                <TouchableOpacity onPress={() => router.back()}>
                    <Icon name="ArrowLeft" />
                </TouchableOpacity>
                <View className="flex-1 flex-row items-center rounded-3xl border border-[#ccc] pl-2">
                    <Icon name="Search" size={20} />
                    <TextInput
                        className="h-10 flex-1 p-0 pt-1 pl-2 text-end text-base leading-7"
                        onChangeText={setKeyword}
                        onEndEditing={handleSearch}
                    />
                </View>
                <TouchableOpacity onPress={handleSearch}>
                    <Text>搜索</Text>
                </TouchableOpacity>
            </View>

            {searched && list.length === 0 && <Empty />}

            {list.map((item) => {
                // DB stores seconds; convert to ms for time.ts
                const firstMs = item.firstEpisodeTimestamp * 1000
                const totalEpisode = item.totalEpisode
                const status = getAnimeStatus(totalEpisode, firstMs)

                return (
                    <TouchableOpacity
                        key={item.id}
                        className="mb-2 flex-row"
                        onPress={() => router.push(`/animeDetail/${item.id}`)}
                        activeOpacity={0.5}
                    >
                        <Image
                            source={item.cover}
                            placeholder={{ blurhash }}
                            contentFit="cover"
                            transition={500}
                            cachePolicy={'memory-disk'}
                            style={styles.cover}
                        />
                        <View>
                            <Text className="text-lg font-medium">{item.name}</Text>
                            <Text className={cn('text-sm')}>
                                状态：
                                <Text className={EStatusColor.raw(status).color}>{EStatus.raw(status).label}</Text>
                            </Text>
                            <Text className="text-sm">
                                更新进度:
                                <Text>{` ${getAiredEpisodeCount(totalEpisode, firstMs)}/${totalEpisode}`}</Text>
                            </Text>
                        </View>
                    </TouchableOpacity>
                )
            })}
        </ScrollView>
    )
}

const width = 80
const styles = StyleSheet.create({
    cover: {
        width: 80,
        height: width * 1.5,
        borderRadius: 6,
        marginRight: 10,
    },
})
