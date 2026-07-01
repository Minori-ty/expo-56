import dayjs from 'dayjs'

import { EStatus } from '@/enums'

import { type AnimeFormValues } from '../schema'
import { EpisodeDateField } from './EpisodeDateField'
import type { FieldProps } from './types.d'

export function LastEpisodeField(props: FieldProps) {
    return (
        <EpisodeDateField
            {...props}
            config={{
                fieldName: 'lastEpisodeYYYYMMDDHHmm',
                getReadOnlyStatus: (status: number) => status === EStatus.toBeUpdated,
                getDisplayValue: (values: AnimeFormValues) => {
                    const { totalEpisode, firstEpisodeYYYYMMDDHHmm } = values
                    if (totalEpisode < 1 || !firstEpisodeYYYYMMDDHHmm) return '-'
                    return dayjs(firstEpisodeYYYYMMDDHHmm, 'YYYY-MM-DD HH:mm')
                        .add(totalEpisode - 1, 'week')
                        .format('YYYY-MM-DD HH:mm')
                },
            }}
        />
    )
}
