import { useSelector } from '@tanstack/react-store'
import dayjs from 'dayjs'
import { useRef } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

import DatePicker, { type IDatePickerRef } from '@/components/Datepicker'
import Icon from '@/components/ui/Icon'
import { cn } from '@/utils/cn'

import { FormItem } from '../FormItem'
import { fieldSchemas, type AnimeFormValues } from '../schema'
import type { AnimeFormApi } from './types.d'
import { firstFieldError } from './useFieldError'

interface EpisodeDateFieldConfig {
    /** 表单字段名 */
    fieldName: 'firstEpisodeYYYYMMDDHHmm' | 'lastEpisodeYYYYMMDDHHmm'
    /** 只读状态下的 status 条件 */
    getReadOnlyStatus: (status: number) => boolean
    /** 只读状态下的显示值计算 */
    getDisplayValue: (values: AnimeFormValues) => string
}

interface EpisodeDateFieldProps {
    form: AnimeFormApi
    label: string
    config: EpisodeDateFieldConfig
}

/**
 * 日期字段通用组件 —— 复用 FirstEpisodeField / LastEpisodeField 的逻辑
 *
 * - 根据 status 判断是否只读
 * - 只读时显示反推/推算的值
 * - 可编辑时使用 DatePicker 选择日期
 */
export function EpisodeDateField({ form, label, config }: EpisodeDateFieldProps) {
    const { fieldName, getReadOnlyStatus, getDisplayValue } = config
    const status = useSelector(form.store, (s) => s.values.status)
    const values = useSelector(form.store, (s) => s.values)
    const pickerRef = useRef<IDatePickerRef>(null)

    // 只读模式
    if (getReadOnlyStatus(status)) {
        const display = getDisplayValue(values)
        return (
            <FormItem label={label}>
                <View className="h-10 flex-row items-center gap-3 rounded-md border border-[#ccc] bg-gray-100 pl-3">
                    <Icon name="CalendarCheck" size={22} color="#9ca3af" />
                    <Text className="text-lg text-gray-400">{display}</Text>
                </View>
            </FormItem>
        )
    }

    // 获取对应的 schema
    const schema =
        fieldName === 'firstEpisodeYYYYMMDDHHmm'
            ? fieldSchemas.firstEpisodeYYYYMMDDHHmm
            : fieldSchemas.lastEpisodeYYYYMMDDHHmm

    // 可编辑模式
    return (
        <form.Field name={fieldName} validators={{ onChange: schema }}>
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
                            <Text className={cn('text-lg', !field.state.value && 'text-gray-400')}>
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
