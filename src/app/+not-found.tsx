import { Link, Stack } from 'expo-router'

import { Text, View } from '@/tw'

export default function NotFound() {
    return (
        <>
            <Stack.Screen options={{ title: '页面未找到' }} />
            <View className="flex-1 items-center justify-center bg-white p-5">
                <Text className="text-xl font-bold text-gray-900">页面未找到</Text>
                <Text className="mt-2 text-base text-gray-600">该页面不存在或已被移除。</Text>
                <Link href="/" className="mt-5">
                    <Text className="text-base text-blue-500">返回首页</Text>
                </Link>
            </View>
        </>
    )
}
