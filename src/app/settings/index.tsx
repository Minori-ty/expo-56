import { nativeApplicationVersion } from 'expo-application'
import { useNavigation } from 'expo-router'
import { useLayoutEffect } from 'react'
import { Text, View } from 'react-native'

import { CompactHeader } from '@/components/ui/CompactHeader'
import Icon from '@/components/ui/Icon'

export default function Settings() {
    const version = nativeApplicationVersion
    const navigation = useNavigation()

    useLayoutEffect(() => {
        navigation.setOptions({
            title: '设置',
            header: ({
                options,
                navigation,
            }: {
                options: Record<string, unknown>
                navigation: { goBack: () => void }
            }) => <CompactHeader options={options} back navigation={navigation} />,
        })
    }, [navigation])

    return (
        <View className="flex-1 bg-gray-50">
            <View className="p-4">
                {/* 关于应用部分 */}
                <View className="mb-6 rounded-lg bg-white p-4 shadow-sm">
                    <Text className="mb-4 text-lg font-semibold text-gray-900">关于应用</Text>

                    <View className="space-y-3">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-gray-600">版本号</Text>
                            <Text className="font-medium text-gray-900">v{version}</Text>
                        </View>

                        <View className="flex-row items-center justify-between py-3">
                            <Text className="text-gray-600">检查更新</Text>
                            <Icon name="ChevronRight" />
                        </View>
                    </View>
                </View>

                {/* 其他设置项 */}
                <View className="rounded-lg bg-white p-4 shadow-sm">
                    <Text className="mb-4 text-lg font-semibold text-gray-900">通用设置</Text>

                    {/* 这里可以添加更多设置项 */}
                    <View className="space-y-3">
                        <Text className="py-3 text-center text-gray-600">暂无其他设置项</Text>
                    </View>
                </View>
            </View>
        </View>
    )
}
