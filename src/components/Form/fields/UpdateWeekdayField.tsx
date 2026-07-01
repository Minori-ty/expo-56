import { Picker } from '@react-native-picker/picker'
import { View } from 'react-native'

import { EWeekday } from '@/enums'
import { cn } from '@/utils/cn'

import { FormItem } from '../FormItem'
import type { FieldProps } from './types'
import { firstFieldError } from './useFieldError'

export function UpdateWeekdayField({ form, label }: FieldProps) {
    return (
        <form.Field name="updateWeekday">
            {(field) => {
                const error = firstFieldError(field.state.meta.errors)
                return (
                    <FormItem label={label} error={error}>
                        <View className={cn('rounded-md border border-[#ccc]', error && 'border-red-500')}>
                            <Picker selectedValue={field.state.value} onValueChange={field.handleChange}>
                                <Picker.Item label="请选择" value="" />
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
