import { themeColor } from '@/styles'
import { cn } from '@/utils/cn'
import { type ClassValue } from 'clsx'
import React from 'react'
import { Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native'

/**
 * 单个 RadioItem 的属性
 */
export interface RadioItemProps<T extends string | number> {
    label: string
    value: T
    selected: boolean
    onPress: (value: T) => void
    size?: number
    color?: string
    labelStyle?: TextStyle
    className?: ClassValue
}

export function RadioItem<T extends string | number>(props: RadioItemProps<T>) {
    const { label, value, selected, onPress, size = 20, color = '#fb7299' } = props
    return (
        <TouchableOpacity
            className="my-1 flex-row items-center"
            onPress={() => onPress(value)}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
        >
            <View className={cn('mr-2 h-6 w-6 items-center justify-center rounded-xl border-2 border-[#409eff]')}>
                {selected ? (
                    <View
                        style={[
                            {
                                backgroundColor: color,
                                width: size / 2,
                                height: size / 2,
                                borderRadius: size / 4,
                            },
                        ]}
                    />
                ) : null}
            </View>
            <Text className={cn('text-lg text-[#222]', props.className)}>{label}</Text>
        </TouchableOpacity>
    )
}

/**
 * RadioGroup 的选项类型
 */
export interface RadioOption<T extends string | number> {
    label: string
    value: T
}
/**
 * RadioGroup 组件的属性
 */
export interface RadioGroupProps<T extends string | number> {
    options: RadioOption<T>[]
    value: T
    onChange: (value: T) => void
    size?: number
    color?: string
    labelStyle?: TextStyle
    style?: ViewStyle
    className?: ClassValue
}

/**
 * RadioGroup 单选组组件
 * 支持 options 自动类型推断
 */
export function RadioGroup<T extends string | number>(props: RadioGroupProps<T>) {
    const { options, value, onChange, size = 20, color = themeColor, labelStyle } = props
    return (
        <View className={cn('flex-row justify-center gap-5', props.className)}>
            {options.map((opt, index) => (
                <RadioItem
                    key={index}
                    label={opt.label}
                    value={opt.value}
                    selected={value === opt.value}
                    onPress={onChange}
                    size={size}
                    color={color}
                    labelStyle={labelStyle}
                />
            ))}
        </View>
    )
}
