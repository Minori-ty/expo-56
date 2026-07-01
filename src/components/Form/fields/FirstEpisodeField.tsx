import dayjs from 'dayjs'

import { EStatus } from '@/enums'

import { type AnimeFormValues } from '../schema'
import { EpisodeDateField } from './EpisodeDateField'
import type { FieldProps } from './types.d'

export function FirstEpisodeField(props: FieldProps) {
    return (
        <EpisodeDateField
            {...props}
            config={{
                fieldName: 'firstEpisodeYYYYMMDDHHmm',
                getReadOnlyStatus: (status: number) => status === EStatus.completed,
                getDisplayValue: (values: AnimeFormValues) => {
                    const { totalEpisode, lastEpisodeYYYYMMDDHHmm } = values
                    if (totalEpisode < 1 || !lastEpisodeYYYYMMDDHHmm) return '-'
                    return dayjs(lastEpisodeYYYYMMDDHHmm, 'YYYY-MM-DD HH:mm')
                        .subtract(totalEpisode - 1, 'week')
                        .format('YYYY-MM-DD HH:mm')
                },
            }}
        />
    )
}
