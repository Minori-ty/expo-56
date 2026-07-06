import { notificationAsync, NotificationFeedbackType } from 'expo-haptics'
import { useRef } from 'react'

import { handleAddAnime } from '@/api'
import { getAnimeByName } from '@/api/anime'
import AnimeForm, { type IAnimeFormRef } from '@/components/Form/AnimeForm'
import { getFormDefaultValues, type AnimeFormValues } from '@/components/Form/schema'
import { useAnimeMutation } from '@/hooks/useAnimeMutation'
import { useNavigationHeader } from '@/hooks/useNavigationHeader'
import { computeFirstEpisodeTimestamp } from '@/utils/time'

export default function AddAnime() {
    useNavigationHeader('添加动漫')

    const baseFormRef = useRef<IAnimeFormRef>(null)

    const { mutate: submitAnime, isPending } = useAnimeMutation({
        mutationFn: handleAddAnime,
        invalidateKeys: [['schedule'], ['settings-calendar']],
    })

    const onSubmit = async (data: AnimeFormValues) => {
        const exists = await getAnimeByName(data.name)
        if (exists) {
            baseFormRef.current?.setNameError('该动漫已存在，请勿重复添加。如需修改，请编辑该动漫。')
            await notificationAsync(NotificationFeedbackType.Error)
            return
        }

        submitAnime({
            name: data.name,
            cover: data.cover,
            totalEpisode: data.totalEpisode,
            firstEpisodeTimestamp: computeFirstEpisodeTimestamp(data),
        })
    }

    return (
        <AnimeForm formData={getFormDefaultValues()} onSubmit={onSubmit} ref={baseFormRef} isSubmitting={isPending} />
    )
}
