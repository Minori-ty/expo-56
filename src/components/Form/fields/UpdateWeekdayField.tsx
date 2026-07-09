import { Picker } from '@react-native-picker/picker'
import { useEffect } from 'react'
import { View } from 'react-native'

import { EWeekday } from '@/enums'
import { cn } from '@/utils/cn'
import { getWeekday } from '@/utils/time'

import { FormItem } from '../FormItem'
import type { FieldProps } from './types.d'
import { firstFieldError } from './useFieldError'

/**
 * 更新周字段内容组件
 *
 * 从 form.Field render prop 中抽取出来，避免在回调中调用 useEffect 违反 Hooks 规则。
 * 当 updateWeekday 没有值时（如切换状态后值为 undefined），自动设置为当前星期。
 *
 * 注：field 泛型类型从 TanStack Form 推导过于复杂，这里用 `Record<string, any>` 接收。
 */
function UpdateWeekdayFieldContent({
    field,
    label,
}: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    field: Record<string, any>
    label: string
}) {
    const error = firstFieldError(field.state.meta.errors)

    useEffect(() => {
        if (!field.state.value) {
            field.handleChange(getWeekday())
        }
    }, [field.state.value, field.handleChange])

    return (
        <FormItem label={label} error={error}>
            <View className={cn('rounded-md border border-[#ccc]', error && 'border-red-500')}>
                <Picker selectedValue={field.state.value} onValueChange={field.handleChange}>
                    {EWeekday.items.map((item) => (
                        <Picker.Item key={item.key} label={item.label} value={item.value} />
                    ))}
                </Picker>
            </View>
        </FormItem>
    )
}

export function UpdateWeekdayField({ form, label }: FieldProps) {
    return (
        <form.Field name="updateWeekday">
            {(field) => <UpdateWeekdayFieldContent field={field} label={label} />}
        </form.Field>
    )
}
