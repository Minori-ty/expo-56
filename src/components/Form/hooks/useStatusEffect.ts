import { useSelector } from '@tanstack/react-store'
import dayjs from 'dayjs'
import { useEffect } from 'react'

import { EStatus } from '@/enums'

import type { AnimeFormApi } from '../fields/types.d'
import type { AnimeFormValues } from '../schema'

/**
 * status 切换 / formData 载入时的字段同步副作用。
 *
 * 复刻原 BaseForm.tsx 的 useEffect 行为：
 *   当 status 为连载中且 totalEpisode===0 时，用 formData.updateTimeHHmm 填充
 *   firstEpisodeYYYYMMDDHHmm、用当前时间填充 lastEpisodeYYYYMMDDHHmm。
 */
export function useStatusEffect(form: AnimeFormApi, formData: AnimeFormValues) {
    const totalEpisode = useSelector(form.store, (s) => s.values.totalEpisode)

    useEffect(() => {
        // 仅在初始渲染时同步一次（formData 不变，不需要追踪）
        if (formData.status === EStatus.serializing && totalEpisode === 0) {
            form.setFieldValue('firstEpisodeYYYYMMDDHHmm', formData.updateTimeHHmm)
            form.setFieldValue('lastEpisodeYYYYMMDDHHmm', dayjs().format('YYYY-MM-DD HH:mm'))
        }
        // totalEpisode 变化时触发状态切换后的同步
        if (totalEpisode !== formData.totalEpisode && formData.status === EStatus.serializing && totalEpisode === 0) {
            form.setFieldValue('lastEpisodeYYYYMMDDHHmm', dayjs().format('YYYY-MM-DD HH:mm'))
        }
    }, [formData.status, formData.totalEpisode, formData.updateTimeHHmm, form, totalEpisode])
}
