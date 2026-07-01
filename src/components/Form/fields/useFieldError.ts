/**
 * 从字段错误数组中提取首个可读错误字符串。
 *
 * 泛型 T 由调用处上下文（form.Field render prop 内 field.state.meta.errors）
 * 推导，无需 any/unknown/as —— 通过 typeof 与 in 类型守卫安全收窄。
 */
export function firstFieldError<T>(errors: readonly T[]): string | undefined {
    const first = errors[0]
    if (first === undefined || first === null) return undefined
    if (typeof first === 'string') return first
    if (typeof first === 'object' && 'message' in first) {
        const msg = first.message
        if (typeof msg === 'string') return msg
    }
    return undefined
}
