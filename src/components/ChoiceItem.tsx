import { type ClassValue } from 'clsx'
import { useState } from 'react'
import { Text, TouchableOpacity } from 'react-native'

import Icon from '@/components/ui/Icon'
import { cn } from '@/utils/cn'

interface IChoiceItemProps<T extends number | string> {
    /** 该行代表的值 */
    value: T
    /** 该行显示的文字 */
    label: string
    /** 当前选中的值 */
    selectedValue: T
    /** 选中时的回调 */
    onSelect: (value: T) => void
}

/**
 * 单选行组件：支持 pressed 高亮 + 命中态图标。
 *
 * 从 my-follows.tsx 里两个几乎完全一致的 `SelectItem` / `SortItem` 合并而来。
 */
export function ChoiceItem<T extends number | string>({ value, label, selectedValue, onSelect }: IChoiceItemProps<T>) {
    const [bgColor, setBgColor] = useState<ClassValue>('bg-white')
    const isSelected = selectedValue === value
    return (
        <TouchableOpacity
            className={cn('flex-row items-center justify-between px-4 py-3', bgColor)}
            onPress={() => onSelect(value)}
            activeOpacity={1}
            onPressIn={() => {
                if (isSelected) return
                setBgColor('bg-gray-300')
            }}
            onPressOut={() => {
                if (isSelected) return
                setBgColor('bg-white')
            }}
        >
            <Text className={cn('text-lg', isSelected && 'text-blue-500')}>{label}</Text>
            {isSelected && <Icon name="Check" size={22} className="text-blue-500" />}
        </TouchableOpacity>
    )
}
