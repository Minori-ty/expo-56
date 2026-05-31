import { View, Text, ScrollView } from "@/tw";

export default function MyFollows() {
  return (
    <ScrollView className="flex-1 bg-white dark:bg-black">
      <View className="flex-1 items-center justify-center p-8 pt-20">
        <Text className="text-6xl mb-4">❤️</Text>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          我的追番
        </Text>
        <Text className="text-base text-gray-500 dark:text-gray-400 text-center">
          管理你正在追的番剧列表
        </Text>

        {/* Placeholder — empty state */}
        <View className="mt-12 items-center gap-4">
          <View className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Text className="text-3xl">📺</Text>
          </View>
          <Text className="text-lg text-gray-400 dark:text-gray-500">
            还没有追番记录
          </Text>
          <Text className="text-sm text-gray-300 dark:text-gray-600 text-center">
            去更新表发现感兴趣的番剧，{'\n'}点击追番即可加入列表
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
