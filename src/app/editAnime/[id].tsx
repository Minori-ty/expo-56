import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { notificationAsync, NotificationFeedbackType } from 'expo-haptics'
import { useLocalSearchParams } from 'expo-router'
import { useMemo, useRef } from 'react'

import { handleUpdateAnimeById } from '@/api'
import { getAnimeByNameExceptItself, parseAnimeData } from '@/api/anime'
import AnimeForm, { type IAnimeFormRef } from '@/components/Form/AnimeForm'
import { getFormDefaultValues, type AnimeFormValues } from '@/components/Form/schema'
import Loading from '@/components/lottie/Loading'
import { db } from '@/db'
import { animeTable } from '@/db/schema'
import { EStatus } from '@/enums'
import { useAnimeMutation } from '@/hooks/useAnimeMutation'
import { useNavigationHeader } from '@/hooks/useNavigationHeader'
import {
    computeFirstEpisodeTimestamp,
    getAiredEpisodeCount,
    getAnimeStatus,
    getLastEpisodeTimestamp,
} from '@/utils/time'

export default function EditAnime() {
    useNavigationHeader('编辑动漫信息')

    const { id } = useLocalSearchParams<{ id: string }>()
    const baseFormRef = useRef<IAnimeFormRef>(null)

    const { data, updatedAt } = useLiveQuery(
        db
            .select()
            .from(animeTable)
            .where(eq(animeTable.id, Number(id))),
    )

    const formData = useMemo<AnimeFormValues>(() => {
        if (!data[0]) {
            return getFormDefaultValues()
        }
        const result = parseAnimeData(data[0])
        const { firstEpisodeTimestamp, totalEpisode, ...reset } = result
        const firstEpisodeYYYYMMDDHHmm = dayjs(firstEpisodeTimestamp).format('YYYY-MM-DD HH:mm')
        const lastEpisodeYYYYMMDDHHmm = dayjs(getLastEpisodeTimestamp(totalEpisode, firstEpisodeTimestamp)).format(
            'YYYY-MM-DD HH:mm',
        )

        const status = getAnimeStatus(totalEpisode, firstEpisodeTimestamp)
        const currentEpisode = getAiredEpisodeCount(totalEpisode, firstEpisodeTimestamp)
        if (status === EStatus.toBeUpdated) {
            return {
                ...reset,
                status,
                totalEpisode,
                firstEpisodeYYYYMMDDHHmm,
                currentEpisode,
            }
        } else if (status === EStatus.completed) {
            return {
                ...reset,
                status,
                totalEpisode,
                lastEpisodeYYYYMMDDHHmm,
                currentEpisode,
            }
        } else {
            return { ...reset, status, totalEpisode, currentEpisode }
        }
    }, [data])

    const isLoading = useMemo(() => {
        return !updatedAt
    }, [updatedAt])

    const { mutate: updateAnimeMution, isPending } = useAnimeMutation({
        mutationFn: handleUpdateAnimeById,
        invalidateKeys: [['anime-detail', id], ['settings-calendar']],
    })

    const onSubmit = async (data: AnimeFormValues) => {
        const exists = await getAnimeByNameExceptItself(data.name, Number(id))
        if (exists) {
            baseFormRef.current?.setNameError('该动漫已存在，请勿重复添加。如需修改，请编辑该动漫。')
            await notificationAsync(NotificationFeedbackType.Error)
            return
        }

        updateAnimeMution({
            animeId: Number(id),
            name: data.name,
            cover: data.cover,
            totalEpisode: data.totalEpisode,
            firstEpisodeTimestamp: computeFirstEpisodeTimestamp(data),
        })
    }

    if (isLoading) {
        return <Loading />
    }

    return <AnimeForm formData={formData} onSubmit={onSubmit} ref={baseFormRef} isSubmitting={isPending} />
}
