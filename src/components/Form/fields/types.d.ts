import type { ReactElement } from 'react'

import type { useAnimeForm } from '../hooks/useAnimeForm'

/** 由 useAnimeForm 推导的 Form 实例类型，避免手写 FormApi 的 11+ 个泛型参数。 */
export type AnimeFormApi = ReturnType<typeof useAnimeForm>

/**
 * Field 组件统一接收的 props。
 *
 * 每个 Field 内部用 `form.Field name="xxx"` 自绑、自渲染、自校验。
 * `label` 由 Renderer 从 fieldRegistry 透传，用于 FormItem。
 */
export interface FieldProps {
    form: AnimeFormApi
    label: string
}

export type FieldComponent = (props: FieldProps) => ReactElement
