import dayjs from 'dayjs'
import { z } from 'zod'

import { EStatus, EWeekday, getCurrentWeekday } from '@/enums'

/**
 * 动漫表单 Schema —— Zod4 单一推导
 *
 * 设计要点：
 * 1. 用 `z.discriminatedUnion('status', [...])` 替代旧 `object().and(discriminatedUnion())`，
 *    `z.infer<typeof animeFormSchema>` 即可得到最终 Form 类型，不再手动维护三套类型。
 * 2. 三个状态分支字段集保持一致（无关字段用 `.optional()` 占位），便于 TanStack Form
 *    统一 defaultValues、字段名统一被 `DeepKeys` 推导。
 * 3. 不再使用 `z.preprocess`：空值转换移到 Field onChange，Schema 保持纯粹。
 * 4. 复杂业务校验（跨字段/时间合理性）放在 form-level validators.onChange 回调中（见
 *    hooks/useAnimeForm.ts），由 superRefine 迁移而来，逻辑与原版完全一致。
 */

const nameField = z.string().min(1, '请输入番剧名称').max(20, '番剧名称长度不能超过20个字符')
const totalEpisodeField = z.number().min(1, '总集数至少为1')
const coverField = z.url('请输入有效的URL')

const updateWeekdayField = z.union([
    z.literal(EWeekday.monday),
    z.literal(EWeekday.tuesday),
    z.literal(EWeekday.wednesday),
    z.literal(EWeekday.thursday),
    z.literal(EWeekday.friday),
    z.literal(EWeekday.saturday),
    z.literal(EWeekday.sunday),
])
const currentEpisodeField = z.number()
const updateTimeHHmmField = z.string().regex(/(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]/, '请输入正确的时间格式HH:mm')
const firstEpisodeField = z.string().min(1, '请选择日期')
const lastEpisodeField = z.string().min(1, '请选择日期')

// ─── 公共字段 ────────────────────────────────────────────────────────────────
const baseFields = {
    name: nameField,
    totalEpisode: totalEpisodeField,
    cover: coverField,
} as const

// ─── 三个状态分支 ────────────────────────────────────────────────────────────
const serializingSchema = z.object({
    ...baseFields,
    status: z.literal(EStatus.serializing),
    updateWeekday: updateWeekdayField,
    currentEpisode: currentEpisodeField,
    updateTimeHHmm: updateTimeHHmmField,
    firstEpisodeYYYYMMDDHHmm: z.string().optional(),
    lastEpisodeYYYYMMDDHHmm: z.string().optional(),
})

const completedSchema = z.object({
    ...baseFields,
    status: z.literal(EStatus.completed),
    lastEpisodeYYYYMMDDHHmm: lastEpisodeField,
    firstEpisodeYYYYMMDDHHmm: z.string().optional(),
    updateWeekday: z.union([updateWeekdayField, z.undefined()]),
    currentEpisode: z.union([currentEpisodeField, z.undefined()]),
    updateTimeHHmm: z.union([updateTimeHHmmField, z.undefined()]),
})

const toBeUpdatedSchema = z.object({
    ...baseFields,
    status: z.literal(EStatus.toBeUpdated),
    firstEpisodeYYYYMMDDHHmm: firstEpisodeField,
    lastEpisodeYYYYMMDDHHmm: z.string().optional(),
    updateWeekday: z.union([updateWeekdayField, z.undefined()]),
    currentEpisode: z.union([currentEpisodeField, z.undefined()]),
    updateTimeHHmm: z.union([updateTimeHHmmField, z.undefined()]),
})

export const animeFormSchema = z.discriminatedUnion('status', [serializingSchema, completedSchema, toBeUpdatedSchema])

export type AnimeFormValues = z.infer<typeof animeFormSchema>

/**
 * 表单默认值 —— 类型由 Schema 推导，单值。
 * 与原 formDefaultValues 行为一致（默认连载中状态）。
 */
export const formDefaultValues: AnimeFormValues = {
    name: '',
    totalEpisode: 0,
    cover: '',
    status: EStatus.serializing,
    updateWeekday: getCurrentWeekday(),
    currentEpisode: 0,
    updateTimeHHmm: dayjs().format('YYYY-MM-DD HH:mm'),
    firstEpisodeYYYYMMDDHHmm: undefined,
    lastEpisodeYYYYMMDDHHmm: undefined,
}

/**
 * 跨字段业务校验 —— 从旧 schema.ts 的 superRefine 迁移而来，逻辑 100% 一致。
 *
 * 返回 TanStack Form form-level validator 所需的 `{ fields: Record<string, string[]> }` 形态，
 * key 对应字段名，TanStack 会把错误挂到对应 field.meta.errors。
 */
export function validateAnimeBusiness(val: AnimeFormValues): {
    fields: Partial<Record<keyof AnimeFormValues, string[]>>
} {
    const fields: Partial<Record<keyof AnimeFormValues, string[]>> = {}

    const addIssue = (path: keyof AnimeFormValues, message: string) => {
        const list = fields[path] ?? []
        list.push(message)
        fields[path] = list
    }

    if (val.status === EStatus.serializing) {
        if (val.currentEpisode === 0) {
            addIssue('currentEpisode', '当前集数至少为1')
        }
        if (val.totalEpisode !== 0) {
            if (val.currentEpisode > val.totalEpisode) {
                addIssue('currentEpisode', '当前集数不能大于总集数')
            }
            if (val.currentEpisode === val.totalEpisode) {
                addIssue('currentEpisode', '该番剧已完结，请选择已完结状态')
            }
        }
    }

    if (val.status === EStatus.completed) {
        const { totalEpisode, lastEpisodeYYYYMMDDHHmm } = val

        // undefined 判断提前：未选日期时 dayjs 解析为 NaN，时间戳比较无意义
        if (totalEpisode !== 0 && lastEpisodeYYYYMMDDHHmm === undefined) {
            addIssue('lastEpisodeYYYYMMDDHHmm', '请选择日期')
        } else {
            const lastEpisodeTimestamp = dayjs(lastEpisodeYYYYMMDDHHmm, 'YYYY-MM-DD HH:mm').unix()
            const firstEpisodeTimestamp = dayjs(lastEpisodeYYYYMMDDHHmm, 'YYYY-MM-DD HH:mm')
                .subtract(totalEpisode - 1, 'week')
                .unix()

            if (firstEpisodeTimestamp > dayjs().unix()) {
                addIssue('lastEpisodeYYYYMMDDHHmm', '当前番剧还未播出，请选择即将更新状态')
            }
            if (lastEpisodeTimestamp > dayjs().unix()) {
                addIssue('lastEpisodeYYYYMMDDHHmm', '当前番剧还未完结，请选择连载中状态')
            }
        }
    }

    if (val.status === EStatus.toBeUpdated) {
        const { firstEpisodeYYYYMMDDHHmm, totalEpisode } = val
        const firstEpisodeTimestamp = dayjs(`${firstEpisodeYYYYMMDDHHmm}`).unix()

        if (firstEpisodeTimestamp <= dayjs().unix()) {
            addIssue('firstEpisodeYYYYMMDDHHmm', '当前番剧连载中，请选择连载中状态')
        }

        if (totalEpisode !== 0) {
            if (firstEpisodeYYYYMMDDHHmm === undefined) {
                addIssue('firstEpisodeYYYYMMDDHHmm', '请选择日期')
            }
        }
    }

    return { fields }
}

// ─── 字段级 zod 子 schema（供 form.Field validators 直接使用）────────────────
export const fieldSchemas = {
    name: nameField,
    totalEpisode: totalEpisodeField,
    cover: coverField,
    currentEpisode: currentEpisodeField,
    updateTimeHHmm: updateTimeHHmmField,
    firstEpisodeYYYYMMDDHHmm: firstEpisodeField,
    lastEpisodeYYYYMMDDHHmm: lastEpisodeField,
    updateWeekday: updateWeekdayField,
} as const
