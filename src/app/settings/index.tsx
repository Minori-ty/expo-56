import { nativeApplicationVersion } from 'expo-application'
import { useNavigation } from 'expo-router'
import { useCallback, useLayoutEffect, useState } from 'react'
import { Alert, Linking, Text, TouchableOpacity, View } from 'react-native'

import { CompactHeader } from '@/components/ui/CompactHeader'
import Icon from '@/components/ui/Icon'

/** 版本号转可比较数字："1.0.3" → 10003 */
function parseVersion(v: string): number {
    return parseInt(
        v
            .split('.')
            .map((s) => s.padStart(2, '0'))
            .join(''),
        10,
    )
}

const UPDATE_JSON_URL = 'https://github.com/Minori-ty/expo-56/releases/latest/download/app_version.json'

export default function Settings() {
    const localVersion = nativeApplicationVersion ?? '0.0.0'
    const navigation = useNavigation()
    const [checking, setChecking] = useState(false)

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

    const checkUpdate = useCallback(async () => {
        if (checking) return
        setChecking(true)
        try {
            const resp = await fetch(UPDATE_JSON_URL)
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

            const data: { version: string; download_url: string } = await resp.json()

            const localNum = parseVersion(localVersion)
            const remoteNum = parseVersion(data.version)

            if (remoteNum > localNum) {
                Alert.alert(`发现新版本 v${data.version}`, `当前版本：v${localVersion}\n是否前往更新？`, [
                    { text: '取消', style: 'cancel' },
                    {
                        text: '更新',
                        onPress: () => Linking.openURL(data.download_url),
                    },
                ])
            } else {
                Alert.alert('检查更新', '当前已是最新版本')
            }
        } catch (e) {
            Alert.alert('检查更新失败', e instanceof Error ? e.message : '网络请求出错')
        } finally {
            setChecking(false)
        }
    }, [checking, localVersion])

    return (
        <View className="flex-1 bg-gray-50">
            <View className="p-4">
                {/* 关于应用部分 */}
                <View className="mb-6 rounded-lg bg-white p-4 shadow-sm">
                    <Text className="mb-4 text-lg font-semibold text-gray-900">关于应用</Text>

                    <View className="space-y-3">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-gray-600">版本号</Text>
                            <Text className="font-medium text-gray-900">v{localVersion}</Text>
                        </View>

                        <TouchableOpacity
                            className="flex-row items-center justify-between py-3"
                            onPress={checkUpdate}
                            disabled={checking}
                        >
                            <Text className="text-gray-600">{checking ? '检查中...' : '检查更新'}</Text>
                            <Icon name="ChevronRight" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-row items-center justify-between py-3"
                            onPress={() => {
                                Linking.openURL('https://github.com/Minori-ty/expo-56')
                            }}
                        >
                            <Text className="text-gray-600">开源主页</Text>
                            <Icon name="ChevronRight" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 其他设置项 */}
                <View className="rounded-lg bg-white p-4 shadow-sm">
                    <Text className="mb-4 text-lg font-semibold text-gray-900">通用设置</Text>

                    <View className="space-y-3">
                        <Text className="py-3 text-center text-gray-600">暂无其他设置项</Text>
                    </View>
                </View>
            </View>
        </View>
    )
}
