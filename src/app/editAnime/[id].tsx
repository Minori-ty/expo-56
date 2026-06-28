import { useMutation } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { notificationAsync, NotificationFeedbackType } from 'expo-haptics'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import React, { useEffect, useMemo, useRef } from 'react'
import { type SubmitHandler } from 'react-hook-form'

import { handleUpdateAnimeById } from '@/api'
import { getAnimeByNameExceptItself, parseAnimeData } from '@/api/anime'
import BaseAnimeForm, { IBaseFormRef } from '@/components/BaseForm'
import Loading from '@/components/lottie/Loading'
import { formDefaultValues, TFormSchema } from '@/components/schema'
import { CompactHeader } from '@/components/ui/CompactHeader'
import { db } from '@/db'
import { animeTable } from '@/db/schema'
import { EStatus } from '@/enums'
import { queryClient } from '@/utils/react-query'
import { getAiredEpisodeCount, getAnimeStatus, getFirstEpisodeTimestamp, getLastEpisodeTimestamp } from '@/utils/time'

export default function EditAnime() {
    const navigation = useNavigation()
    useEffect(() => {
        navigation.setOptions({
            title: '编辑动漫信息',
            header: ({
                options,
                navigation,
            }: {
                options: Record<string, unknown>
                navigation: { goBack: () => void }
            }) => <CompactHeader options={options} back navigation={navigation} />,
        })
    }, [navigation])

    const { id } = useLocalSearchParams<{ id: string }>()

    const baseFormRef = useRef<IBaseFormRef>(null)

    const { data, updatedAt } = useLiveQuery(
        db
            .select()
            .from(animeTable)
            .where(eq(animeTable.id, Number(id))),
    )

    const formData = useMemo<TFormSchema>(() => {
        if (!data[0]) {
            return formDefaultValues
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

    const onSubmit: SubmitHandler<TFormSchema> = async (data) => {
        const { name, cover, totalEpisode } = data
        const result = await handleValidateAnimeNameIsExist(name, Number(id))
        if (result) {
            await notificationAsync(NotificationFeedbackType.Error)
            return
        }
        if (data.status === EStatus.serializing) {
            const { currentEpisode, updateTimeHHmm, updateWeekday } = data
            if (updateWeekday === '') return
            updateAnimeMution({
                animeId: Number(id),
                name,
                totalEpisode,
                cover,
                firstEpisodeTimestamp: getFirstEpisodeTimestamp({ currentEpisode, updateTimeHHmm, updateWeekday }),
            })
        } else if (data.status === EStatus.completed) {
            const { lastEpisodeYYYYMMDDHHmm } = data
            updateAnimeMution({
                animeId: Number(id),
                name,
                totalEpisode,
                cover,
                firstEpisodeTimestamp: dayjs(lastEpisodeYYYYMMDDHHmm, 'YYYY-MM-DD HH:mm')
                    .subtract(totalEpisode - 1, 'week')
                    .second(0)
                    .valueOf(),
            })
        } else if (data.status === EStatus.toBeUpdated) {
            const { firstEpisodeYYYYMMDDHHmm } = data
            updateAnimeMution({
                animeId: Number(id),
                name,
                totalEpisode,
                cover,
                firstEpisodeTimestamp: dayjs(firstEpisodeYYYYMMDDHHmm, 'YYYY-MM-DD HH:mm').second(0).valueOf(),
            })
        }
    }

    const { mutate: updateAnimeMution } = useMutation({
        mutationFn: handleUpdateAnimeById,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['anime-detail', id],
            })

            queryClient.invalidateQueries({
                queryKey: ['settings-calendar'],
            })

            router.back()
        },
        onError: (err) => {
            alert(err)
        },
    })
    /**
     * 校验动漫名是否存在
     */
    async function handleValidateAnimeNameIsExist(name: string, id: number) {
        const result = await getAnimeByNameExceptItself(name, id)
        if (result) {
            baseFormRef.current?.setNameError('该动漫已存在，请勿重复添加。如需修改，请编辑该动漫。')
            return true
        }
        return false
    }

    if (isLoading) {
        return <Loading />
    }

    return <BaseAnimeForm formData={formData} onSubmit={onSubmit} ref={baseFormRef} />
}
