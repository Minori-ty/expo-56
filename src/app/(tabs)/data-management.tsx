import { getFileExportsPermission } from '@/permissions'
import { ScrollView, Text, View } from '@/tw'
import { Pressable } from 'react-native'

export default function DataManagement() {
    return (
        <ScrollView className="flex-1 bg-white dark:bg-black">
            <View className="flex-1 items-center justify-center p-8">
                <Text className="text-base text-gray-500 dark:text-gray-400 text-center mb-8">
                    导入导出追番数据，备份与恢复
                </Text>

                {/* Placeholder — data actions */}
                <View className="w-full gap-3">
                    <View className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950">
                        <Pressable
                            onPress={() => {
                                getFileExportsPermission()
                            }}
                        >
                            <Text className="text-lg font-semibold text-blue-600 dark:text-blue-400">📥 导入数据</Text>
                        </Pressable>
                        <Text className="text-sm text-blue-400 dark:text-blue-500 mt-1">从文件导入番剧列表</Text>
                    </View>

                    <View className="p-4 rounded-xl bg-green-50 dark:bg-green-950">
                        <Text className="text-lg font-semibold text-green-600 dark:text-green-400">📤 导出数据</Text>
                        <Text className="text-sm text-green-400 dark:text-green-500 mt-1">将追番数据导出为文件</Text>
                    </View>

                    <View className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950">
                        <Text className="text-lg font-semibold text-orange-600 dark:text-orange-400">☁️ 云端同步</Text>
                        <Text className="text-sm text-orange-400 dark:text-orange-500 mt-1">
                            同步数据到云端（即将推出）
                        </Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    )
}
