import { useSelector } from '@tanstack/react-store'
import dayjs from 'dayjs'
import { useEffect } from 'react'

import { EStatus } from '@/enums'

import type { AnimeFormApi } from '../fields/types'
import type { AnimeFormValues } from '../schema'

/**
 * status 切换 / formData 载入时的字段同步副作用。
 *
 * 复刻原 BaseForm.tsx 的 useEffect 行为：
 *   当 status 为连载中且 totalEpisode===0 时，用 formData.updateTimeHHmm 填充
 *   firstEpisodeYYYYMMDDHHmm、用当前时间填充 lastEpisodeYYYYMMDDHHmm。
 *
 * 依赖：formData（初始/编辑回填值）+ totalEpisode 当前值。与原版依赖列表一致。
 */
export function useStatusEffect(form: AnimeFormApi, formData: AnimeFormValues) {
    const totalEpisode = useSelector(form.store, (s) => s.values.totalEpisode)

    useEffect(() => {
        if (formData.status === EStatus.serializing) {
            if (totalEpisode === 0) {
                form.setFieldValue('firstEpisodeYYYYMMDDHHmm', formData.updateTimeHHmm)
                form.setFieldValue('lastEpisodeYYYYMMDDHHmm', dayjs().format('YYYY-MM-DD HH:mm'))
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData, totalEpisode])
}
