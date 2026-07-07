import dayjs from 'dayjs'
import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { CalendarDay } from 'react-native-ui-datepicker'

import { useAnimeDetailContext } from '@/contexts/animeDetailContext'
import { checkEpisodeUpdate } from '@/hooks/checkEpisodeUpdate'
import { cn } from '@/utils/cn'
import { getAiredEpisodeCount } from '@/utils/time'

/**
 * 日历单元格组件。
 *
 * 展示日期文字 + 当天对应的番剧集数（若命中）。
 * 从 animeDetail/[id].tsx 抽出，让主页面聚焦布局与业务。
 */
export function Day(day: CalendarDay) {
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
                // oxlint-disable-next-line tailwindcss/no-unknown-classes
                'will-change-variable relative w-full flex-1 items-center rounded border',
                isToday ? 'border-blue-500 bg-blue-500' : 'border-transparent bg-white',
                isSelected && !isToday && 'border-blue-500',
            )}
        >
            <Text
                className={cn(
                    // oxlint-disable-next-line tailwindcss/no-unknown-classes
                    'will-change-variable top-2',
                    isToday && 'text-white',
                    !isCurrentMonth && 'text-gray-200',
                )}
            >
                {day.text}
            </Text>
            <View className="absolute bottom-2 w-full">
                <Text
                    className={cn(
                        // oxlint-disable-next-line tailwindcss/no-unknown-classes
                        'will-change-variable text-center',
                        !isCurrentMonth && 'text-gray-200',
                        isToday && 'text-white',
                        !isToday && isCurrentMonth && episode && 'text-orange-500',
                    )}
                    style={styles.episodeText}
                >
                    {episode}
                </Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    episodeText: {
        fontSize: 6,
    },
})
