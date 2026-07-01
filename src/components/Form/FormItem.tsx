import { type ReactNode } from 'react'
import { Text, View } from 'react-native'

export interface FormItemProps {
    label: string
    error?: string
    children: ReactNode
}

/** 表单项容器：label + 内容 + 错误提示。沿用原 BaseForm 中的样式。 */
export function FormItem({ label, error, children }: FormItemProps) {
    return (
        <View className="mb-4">
            <Text className="mb-2 text-lg font-medium">{label}</Text>
            {children}
            {error ? <Text className="mt-1 text-base text-red-500">{error}</Text> : null}
        </View>
    )
}
