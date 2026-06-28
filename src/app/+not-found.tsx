import { Link, Stack } from 'expo-router'

import Error from '@/components/lottie/Error'
import { Text, View } from '@/tw'

export default function NotFound() {
    return (
        <>
            <Stack.Screen options={{ title: '页面未找到' }} />
            <Error error={{ message: '该页面不存在或已被移除。' }} />
            <View className="absolute bottom-10 w-full items-center">
                <Link href="/">
                    <Text className="text-base text-blue-500">返回首页</Text>
                </Link>
            </View>
        </>
    )
}
