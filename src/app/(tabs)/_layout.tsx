import { Text, View } from '@/tw'
import { Tabs } from 'expo-router'

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#208AEF',
                tabBarInactiveTintColor: '#8E8E93',
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopColor: '#E5E5EA',
                    borderTopWidth: 0.5,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: '更新表',
                    tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>📅</Text>,
                }}
            />
            <Tabs.Screen
                name="my-follows"
                options={{
                    title: '我的追番',
                    headerShown: true,
                    header: () => (
                        <View className="h-11 bg-white dark:bg-black justify-end items-center pb-2">
                            <Text className="font-semibold text-gray-900 dark:text-white text-2xl">我的追番</Text>
                        </View>
                    ),
                    tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>❤️</Text>,
                }}
            />
            <Tabs.Screen
                name="data-management"
                options={{
                    title: '数据管理',
                    headerShown: true,
                    header: () => (
                        <View className="h-11 bg-white dark:bg-black justify-end items-center pb-2">
                            <Text className="font-semibold text-gray-900 dark:text-white text-2xl">数据管理</Text>
                        </View>
                    ),
                    tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>📊</Text>,
                }}
            />
        </Tabs>
    )
}
