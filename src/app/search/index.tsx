import { Enum } from 'enum-plus'
import { router, useNavigation } from 'expo-router'
import { useLayoutEffect, useState } from 'react'
import { StyleSheet } from 'react-native'

import { getAnimeListByName } from '@/api/anime'
import Icon from '@/components/ui/Icon'
import { animeTable } from '@/db/schema'
import { EStatus } from '@/enums'
import { blurhash } from '@/styles'
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from '@/tw'
import { Image } from '@/tw/image'
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
    type AnimeRow = (typeof animeTable)['$inferSelect']
    const [list, setList] = useState<AnimeRow[]>([])

    async function handleSearch() {
        if (!keyword) return
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
    } as const)

    return (
        <SafeAreaView className="flex-1 bg-white px-6">
            <ScrollView className="flex-1">
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
                                    <Text className={cn(EStatusColor.raw(status).color)}>
                                        {EStatus.raw(status).label}
                                    </Text>
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
        </SafeAreaView>
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
