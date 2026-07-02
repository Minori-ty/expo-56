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
 *
 * 触发时机（依赖 totalEpisode 是从 form.store 订阅的实时值）：
 *   1) 页面挂载：formData / totalEpisode 首次到位时同步一次；
 *   2) 用户把 totalEpisode 修改为 0（含从非 0 回退到 0）：重新走同步分支，
 *      这也是当前实际期望的行为——把 lastEpisodeYYYYMMDDHHmm 重置到"现在"。
 *   注意不是"仅初始渲染一次"，请勿据此假设幂等。
 */
export function useStatusEffect(form: AnimeFormApi, formData: AnimeFormValues) {
    const totalEpisode = useSelector(form.store, (s) => s.values.totalEpisode)

    useEffect(() => {
        // 使用 { dontUpdateMeta: true } 保证 setFieldValue 不会把表单弄脏（isDirty 保持 false），
        // 从而不会让 form-level validators.onChange 的守卫失效，避免刚进入页面就跑校验。
        // 分支 A：初始 / formData 变化时，若为连载中且总集数未填，用 updateTimeHHmm 与"现在"预填。
        if (formData.status === EStatus.serializing && totalEpisode === 0) {
            form.setFieldValue('firstEpisodeYYYYMMDDHHmm', formData.updateTimeHHmm, { dontUpdateMeta: true })
            form.setFieldValue('lastEpisodeYYYYMMDDHHmm', dayjs().format('YYYY-MM-DD HH:mm'), {
                dontUpdateMeta: true,
            })
        }
        // 分支 B：用户运行时把 totalEpisode 归零时，把 lastEpisode 重置到"现在"。
        if (totalEpisode !== formData.totalEpisode && formData.status === EStatus.serializing && totalEpisode === 0) {
            form.setFieldValue('lastEpisodeYYYYMMDDHHmm', dayjs().format('YYYY-MM-DD HH:mm'), {
                dontUpdateMeta: true,
            })
        }
    }, [formData.status, formData.totalEpisode, formData.updateTimeHHmm, form, totalEpisode])
}
