import { useForm } from '@tanstack/react-form'

import { animeFormSchema, validateAnimeBusiness, type AnimeFormValues } from '../schema'

export interface UseAnimeFormOptions {
    defaultValues: AnimeFormValues
    onSubmit: (values: AnimeFormValues) => void | Promise<void>
    /** 表单校验失败时（未触发 onSubmit）的回调，用于错误反馈。 */
    onSubmitInvalid?: () => void
}

/**
 * 合并 zod discriminatedUnion 整体校验 + 业务跨字段校验，返回
 * TanStack Form form-level validator 所需的 { fields } 形态。
 * 无错误时返回 undefined（清空 form-level errors）。
 */
function runFormValidation(value: AnimeFormValues) {
    const parsed = animeFormSchema.safeParse(value)
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

    const business = validateAnimeBusiness(value)
    for (const [k, messages] of Object.entries(business.fields)) {
        if (!messages) continue
        const list = fields[k] ?? []
        list.push(...messages)
        fields[k] = list
    }

    if (Object.keys(fields).length === 0) return undefined
    return { fields }
}

/**
 * 动漫表单 Form 创建 —— 封装 useForm，注入：
 *   - defaultValues
 *   - form-level validators.onChange：先跑 zod discriminatedUnion 整体校验（字段级
 *     错误按 issue.path 挂到对应 field），再跑业务校验 validateAnimeBusiness
 *     （跨字段/时间合理性，复用原 superRefine 逻辑）。
 *     带门闸：只有 isDirty 或已尝试提交时才跑，避免刚进入页面就显示一堆错误。
 *   - form-level validators.onSubmit：同一套校验，无门闸，保证点提交时一定会跑。
 *   - onSubmit / onSubmitInvalid
 *
 * 触发时机：
 *   1) 输入时：字段变更 → isDirty=true → onChange 跑校验 → 错误显示
 *   2) 提交时：handleSubmit → 内部先跑 validateAllFields('submit')（触发 onSubmit
 *      + 字段级 onSubmit），错误挂上；即便用户没输过任何东西也能触发
 *
 * 返回 ReactFormExtendedApi，含 .Field / .Subscribe / .useStore 等 React 扩展。
 */
export function useAnimeForm({ defaultValues, onSubmit, onSubmitInvalid }: UseAnimeFormOptions) {
    return useForm({
        defaultValues,
        validators: {
            onChange: ({ value, formApi }) => {
                // 门闸：只有当用户真正操作过（isDirty）或已尝试提交过（submissionAttempts > 0）
                // 时才跑校验，避免刚进入页面就显示一堆错误。
                const { isDirty, submissionAttempts } = formApi.state
                if (!isDirty && submissionAttempts === 0) return undefined
                return runFormValidation(value)
            },
            // 提交时兜底：无论 isDirty 与否，都跑一次校验，保证空表单点提交能给出错误。
            onSubmit: ({ value }) => runFormValidation(value),
        },
        onSubmit: ({ value }) => onSubmit(value),
        onSubmitInvalid,
    })
}
