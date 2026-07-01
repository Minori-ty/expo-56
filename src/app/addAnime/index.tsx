import { useMutation } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { notificationAsync, NotificationFeedbackType } from 'expo-haptics'
import { router, useNavigation } from 'expo-router'
import React, { useEffect, useLayoutEffect, useRef } from 'react'
import { BackHandler } from 'react-native'

import { handleAddAnime } from '@/api'
import { getAnimeByName } from '@/api/anime'
import AnimeForm, { type IAnimeFormRef } from '@/components/Form/AnimeForm'
import { formDefaultValues, type AnimeFormValues } from '@/components/Form/schema'
import { CompactHeader } from '@/components/ui/CompactHeader'
import { EStatus } from '@/enums'
import { queryClient } from '@/utils/react-query'
import { getFirstEpisodeTimestamp, getFirstEpisodeTimestampFromLast } from '@/utils/time'

export default function AddAnime() {
    const navigation = useNavigation()
    useLayoutEffect(() => {
        navigation.setOptions({
            title: '添加动漫',
            header: ({
                options,
                navigation,
            }: {
                options: Record<string, unknown>
                navigation: { goBack: () => void }
            }) => <CompactHeader options={options} back navigation={navigation} />,
        })
    }, [navigation])

    const baseFormRef = useRef<IAnimeFormRef>(null)
    const onSubmit = async (data: AnimeFormValues) => {
        const { name, cover, totalEpisode } = data
        const result = await handleValidateAnimeNameIsExist(name)
        if (result) {
            return
        }
        if (data.status === EStatus.serializing) {
            const { currentEpisode, updateTimeHHmm, updateWeekday } = data
            if (updateWeekday === '') return
            handleAddAnimeMution({
                name,
                totalEpisode,
                cover,
                firstEpisodeTimestamp: getFirstEpisodeTimestamp({ currentEpisode, updateTimeHHmm, updateWeekday }),
            })
        } else if (data.status === EStatus.completed) {
            const { lastEpisodeYYYYMMDDHHmm } = data
            handleAddAnimeMution({
                name,
                totalEpisode,
                cover,
                firstEpisodeTimestamp: getFirstEpisodeTimestampFromLast(
                    totalEpisode,
                    dayjs(lastEpisodeYYYYMMDDHHmm, 'YYYY-MM-DD HH:mm').valueOf(),
                ),
            })
        } else if (data.status === EStatus.toBeUpdated) {
            const { firstEpisodeYYYYMMDDHHmm } = data
            handleAddAnimeMution({
                name,
                totalEpisode,
                cover,
                firstEpisodeTimestamp: dayjs(firstEpisodeYYYYMMDDHHmm, 'YYYY-MM-DD HH:mm').second(0).valueOf(),
            })
        }
    }

    const { mutate: handleAddAnimeMution, isPending } = useMutation({
        mutationFn: handleAddAnime,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['schedule'],
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

    // 提交时禁止安卓返回键
    useEffect(() => {
        if (!isPending) return
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => true)
        return () => subscription.remove()
    }, [isPending])

    /**
     * 校验动漫名是否存在
     */
    async function handleValidateAnimeNameIsExist(name: string) {
        const result = await getAnimeByName(name)
        if (result) {
            baseFormRef.current?.setNameError('该动漫已存在，请勿重复添加。如需修改，请编辑该动漫。')
            notificationAsync(NotificationFeedbackType.Error)
            return true
        }
        return false
    }

    return <AnimeForm formData={formDefaultValues} onSubmit={onSubmit} ref={baseFormRef} isSubmitting={isPending} />
}
