'use client'

import { type ClassValue } from 'clsx'
import { Check, Minus } from 'lucide-react-native'
import { useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

type CheckboxState = 'unchecked' | 'checked' | 'indeterminate'

interface CheckboxProps {
    /** 是否启用半选状态 */
    allowIndeterminate?: boolean
    /** 初始状态 */
    defaultState?: CheckboxState
    /** 受控状态值 */
    state?: CheckboxState
    /** 状态改变回调 */
    onStateChange?: (state: CheckboxState) => void
    /** 是否禁用 */
    disabled?: boolean
    /** 标签文本 */
    label?: string
    /** 自定义样式类名 */
    className?: ClassValue
    /** 大小 */
    size?: 'sm' | 'md' | 'lg'
    /** 标签样式 */
    labelClassName?: ClassValue
}

export default function Checkbox({
    allowIndeterminate = false,
    defaultState = 'unchecked',
    state,
    onStateChange,
    disabled = false,
    label,
    className,
    size = 'md',
    labelClassName,
}: CheckboxProps) {
    const [internalState, setInternalState] = useState<CheckboxState>(defaultState)

    const currentState = state ?? internalState

    const handlePress = () => {
        if (disabled) return

        let nextState: CheckboxState

        if (allowIndeterminate) {
            // 三状态循环：unchecked -> checked -> indeterminate -> unchecked
            switch (currentState) {
                case 'unchecked':
                    nextState = 'checked'
                    break
                case 'checked':
                    nextState = 'indeterminate'
                    break
                case 'indeterminate':
                    nextState = 'unchecked'
                    break
                default:
                    nextState = 'unchecked'
            }
        } else {
            // 两状态切换：unchecked <-> checked
            nextState = currentState === 'checked' ? 'unchecked' : 'checked'
        }

        if (state === undefined) {
            setInternalState(nextState)
        }
        onStateChange?.(nextState)
    }

    const getSizeClasses = () => {
        switch (size) {
            case 'sm':
                return 'w-4 h-4'
            case 'lg':
                return 'w-6 h-6'
            case 'md':
            default:
                return 'w-5 h-5'
        }
    }

    const getIconSize = () => {
        switch (size) {
            case 'sm':
                return 12
            case 'lg':
                return 16
            case 'md':
            default:
                return 14
        }
    }

    const getCheckboxClasses = () => {
        const baseClasses: ClassValue = `${getSizeClasses()} rounded border items-center justify-center`

        if (disabled) {
            return `${baseClasses} opacity-50`
        }

        switch (currentState) {
            case 'checked':
            case 'indeterminate':
                return `${baseClasses} bg-blue-600 border-blue-600`
            case 'unchecked':
            default:
                return `${baseClasses} bg-white border-gray-300`
        }
    }

    const renderIcon = () => {
        const iconSize = getIconSize()
        const iconColor = currentState === 'unchecked' ? '#374151' : '#ffffff'

        switch (currentState) {
            case 'checked':
                return <Check size={iconSize} color={iconColor} />
            case 'indeterminate':
                return <Minus size={iconSize} color={iconColor} />
            case 'unchecked':
            default:
                return null
        }
    }

    return (
        <TouchableOpacity
            className={`flex-row items-center ${className || ''}`}
            onPress={handlePress}
            disabled={disabled}
            activeOpacity={disabled ? 1 : 0.7}
            accessibilityRole="checkbox"
            accessibilityState={{
                checked: currentState === 'indeterminate' ? 'mixed' : currentState === 'checked',
                disabled,
            }}
        >
            <View className={getCheckboxClasses()}>{renderIcon()}</View>
            {label && (
                <Text
                    className={`ml-2 text-sm font-medium ${
                        disabled ? 'text-gray-400 opacity-50' : 'text-gray-900'
                    } ${labelClassName || ''}`}
                >
                    {label}
                </Text>
            )}
        </TouchableOpacity>
    )
}
