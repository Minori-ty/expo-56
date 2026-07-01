import { useSelector } from '@tanstack/react-store'
import dayjs from 'dayjs'
import { useRef } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

import DatePicker, { type IDatePickerRef } from '@/components/Datepicker'
import Icon from '@/components/ui/Icon'
import { EStatus } from '@/enums'
import { cn } from '@/utils/cn'

import { FormItem } from '../FormItem'
import { useFirstEpisodeDisplay } from '../hooks/useEpisodeDate'
import { fieldSchemas } from '../schema'
import type { FieldProps } from './types'
import { firstFieldError } from './useFieldError'

export function FirstEpisodeField({ form, label }: FieldProps) {
    const status = useSelector(form.store, (s) => s.values.status)
    const display = useFirstEpisodeDisplay(form)
    const pickerRef = useRef<IDatePickerRef>(null)

    // completed 状态下首播为只读展示（由完结反推），与原 BaseForm 行为一致
    if (status === EStatus.completed) {
        return (
            <FormItem label={label}>
                <View className="h-10 flex-row items-center gap-3 rounded-md border border-[#ccc] bg-gray-100 pl-3">
                    <Icon name="CalendarCheck" size={22} color="#9ca3af" />
                    <Text className="text-lg text-gray-400">{display}</Text>
                </View>
            </FormItem>
        )
    }

    // toBeUpdated 状态下首播可编辑
    return (
        <form.Field name="firstEpisodeYYYYMMDDHHmm" validators={{ onChange: fieldSchemas.firstEpisodeYYYYMMDDHHmm }}>
            {(field) => {
                const error = firstFieldError(field.state.meta.errors)
                return (
                    <FormItem label={label} error={error}>
                        <TouchableOpacity
                            activeOpacity={0.5}
                            className={cn(
                                'h-10 flex-row items-center gap-3 rounded-md border border-[#ccc] pl-3',
                                error && 'border-red-500',
                            )}
                            onPress={() => pickerRef.current?.open()}
                        >
                            <Icon name="CalendarClock" size={22} color={error ? '#ef4444' : undefined} />
                            <Text className={cn('text-lg', field.state.value ?? 'text-gray-400')}>
                                {field.state.value ?? '请选择日期'}
                            </Text>
                        </TouchableOpacity>
                        <DatePicker
                            ref={pickerRef}
                            date={field.state.value}
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
