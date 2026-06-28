import type { ReactNode } from 'react'

import Icon from '@/components/ui/Icon'
import { Text, TouchableOpacity, View } from '@/tw'

type HeaderRightFn = (props: { canGoBack: boolean; tintColor?: string }) => ReactNode

interface CompactHeaderProps {
    options: {
        headerRight?: HeaderRightFn
        title?: string
    }
    back?: boolean
    navigation?: { goBack: () => void }
}

export function CompactHeader({ options, back = false, navigation }: CompactHeaderProps) {
    const { headerRight: HeaderRight, title } = options

    return (
        <View className="flex-row items-center bg-white px-2" style={{ height: 36 }}>
            <View className="flex-1 flex-row justify-start">
                {back && navigation ? (
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Icon name="ArrowLeft" size={28} />
                    </TouchableOpacity>
                ) : null}
            </View>
            <Text className="flex items-start justify-start text-2xl font-semibold">{title ?? ''}</Text>
            <View className="flex-1 flex-row justify-end">
                {HeaderRight ? HeaderRight({ canGoBack: false }) : null}
            </View>
        </View>
    )
}
