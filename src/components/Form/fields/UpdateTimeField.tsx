import dayjs from 'dayjs'
import { useRef } from 'react'
import { Text, TouchableOpacity } from 'react-native'

import DatePicker, { type IDatePickerRef } from '@/components/Datepicker'
import Icon from '@/components/ui/Icon'
import { cn } from '@/utils/cn'

import { FormItem } from '../FormItem'
import { fieldSchemas } from '../schema'
import type { FieldProps } from './types'
import { firstFieldError } from './useFieldError'

export function UpdateTimeField({ form, label }: FieldProps) {
    const pickerRef = useRef<IDatePickerRef>(null)
    return (
        <form.Field name="updateTimeHHmm" validators={{ onChange: fieldSchemas.updateTimeHHmm }}>
            {(field) => {
                const error = firstFieldError(field.state.meta.errors)
                return (
                    <FormItem label={label} error={error}>
                        <TouchableOpacity
                            activeOpacity={0.5}
                            className={cn(
                                'h-10 flex-row items-center rounded-md border border-[#ccc] pl-3',
                                error && 'border-red-500',
                            )}
                            onPress={() => pickerRef.current?.open()}
                        >
                            <Icon name="Clock" size={22} color={error ? '#ef4444' : undefined} />
                            <Text className="ml-3 text-lg">{dayjs(field.state.value).format('HH:mm')}</Text>
                        </TouchableOpacity>
                        <DatePicker
                            ref={pickerRef}
                            date={field.state.value}
                            hideHeader
                            onChange={(date) => {
                                field.handleChange(dayjs(date).format('YYYY-MM-DD HH:mm'))
                            }}
                        />
                    </FormItem>
                )
            }}
        </form.Field>
    )
}
