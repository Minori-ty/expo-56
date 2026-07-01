import { Picker } from '@react-native-picker/picker'
import { useEffect } from 'react'
import { View } from 'react-native'

import { EWeekday, getCurrentWeekday } from '@/enums'
import { cn } from '@/utils/cn'

import { FormItem } from '../FormItem'
import type { FieldProps } from './types.d'
import { firstFieldError } from './useFieldError'

export function UpdateWeekdayField({ form, label }: FieldProps) {
    return (
        <form.Field name="updateWeekday">
            {(field) => {
                const error = firstFieldError(field.state.meta.errors)

                // 当更新周没有值时，自动设置为当前周几（如切换状态后 updateWeekday 为 undefined）
                useEffect(() => {
                    if (!field.state.value) {
                        field.handleChange(getCurrentWeekday())
                    }
                }, [field.state.value])

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
            }}
        </form.Field>
    )
}
