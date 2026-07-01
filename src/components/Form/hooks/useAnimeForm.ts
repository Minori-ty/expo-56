import { useForm } from '@tanstack/react-form'

import {
    animeFormSchema,
    validateAnimeBusiness,
    type AnimeFormValues,
} from '../schema'

export interface UseAnimeFormOptions {
    defaultValues: AnimeFormValues
    onSubmit: (values: AnimeFormValues) => void | Promise<void>
    /** 表单校验失败时（未触发 onSubmit）的回调，用于错误反馈。 */
    onSubmitInvalid?: () => void
}

/**
 * 动漫表单 Form 创建 —— 封装 useForm，注入：
 *   - defaultValues
 *   - form-level validators.onChange：先跑 zod discriminatedUnion 整体校验（字段级
 *     错误按 issue.path 挂到对应 field），再跑业务校验 validateAnimeBusiness
 *     （跨字段/时间合理性，复用原 superRefine 逻辑）。
 *   - onSubmit / onSubmitInvalid
 *
 * 返回 ReactFormExtendedApi，含 .Field / .Subscribe / .useStore 等 React 扩展。
 */
export function useAnimeForm({ defaultValues, onSubmit, onSubmitInvalid }: UseAnimeFormOptions) {
    return useForm({
        defaultValues,
        validators: {
            onChange: (ctx) => {
                // 1. zod schema 整体校验：safeParse 返回明确的同步结果
                const parsed = animeFormSchema.safeParse(ctx.value)
                const fields: Record<string, Array<string | { message: string }>> = {}

                if (!parsed.success) {
                    for (const issue of parsed.error.issues) {
                        const pathSegments = issue.path ?? []
                        const key = pathSegments.map((p) => String(p)).join('.')
                        const list = fields[key] ?? []
                        list.push(issue.message)
                        fields[key] = list
                    }
                }

                // 2. 业务校验（跨字段/时间合理性），与 zod 错误合并
                const business = validateAnimeBusiness(ctx.value)
                for (const [k, messages] of Object.entries(business.fields)) {
                    if (!messages) continue
                    const list = fields[k] ?? []
                    list.push(...messages)
                    fields[k] = list
                }

                if (Object.keys(fields).length === 0) return undefined
                return { fields }
            },
        },
        onSubmit: ({ value }) => onSubmit(value),
        onSubmitInvalid,
    })
}
