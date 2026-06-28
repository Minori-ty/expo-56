import { cn } from '@/utils/cn'
import { type ClassValue } from 'clsx'
import React, { Fragment } from 'react'
import { Text, View } from 'react-native'

interface IProps {
    title: string
    actions?: React.ReactNode[]
    leading?: React.ReactNode
    className?: ClassValue
}

function PageHeader({ title, actions, leading, className }: IProps) {
    return (
        <View className={cn('mb-2 h-8 flex-row items-center justify-center', className)}>
            <View className="flex-row items-center">
                {leading}
                <Text className="ml-2 text-2xl font-medium text-gray-900">{title}</Text>
            </View>
            <View className="absolute right-0 mr-5 flex-row items-center gap-3">
                {actions &&
                    actions.map((item, index) => {
                        return <Fragment key={index}>{item}</Fragment>
                    })}
            </View>
        </View>
    )
}

export default PageHeader
