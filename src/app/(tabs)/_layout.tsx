import migrations from '@drizzle/migrations'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import { useFonts } from 'expo-font'
import { Tabs } from 'expo-router'
import { useEffect } from 'react'
import { ColorValue, Platform, Text } from 'react-native'

import { HapticTab } from '@/components/HapticTab'
import Loading from '@/components/lottie/Loading'
import { CompactHeader } from '@/components/ui/CompactHeader'
import Icon from '@/components/ui/Icon'
import TabBarBackground from '@/components/ui/TabBarBackground'
import { db } from '@/db'
import { themeColorPurple } from '@/styles'
import { cleanupOrphanedCalendarEvents } from '@/utils/calendar'

export default function TabLayout() {
    const { success, error } = useMigrations(db, migrations)
    const [loaded] = useFonts({
        SpaceMono: require('@assets/fonts/SpaceMono-Regular.ttf'),
    })

    useEffect(() => {
        let timer: NodeJS.Timeout
        if (success) {
            timer = setTimeout(async () => {
                cleanupOrphanedCalendarEvents()
            }, 0)
        }
        return () => {
            clearTimeout(timer)
        }
    }, [success])

    if (!loaded) {
        return <Loading />
    }

    if (error) {
        return <Text>Migration 错误: {error.message}</Text>
    }
    if (!success) {
        return <Text>正在 Migration...</Text>
    }
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: themeColorPurple,
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarBackground: TabBarBackground,
                tabBarStyle: Platform.select({
                    ios: {
                        position: 'absolute',
                    },
                }),
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: '更新表',
                    tabBarIcon: IndexIcon,
                }}
            />
            <Tabs.Screen
                name="my-follows"
                options={() => ({
                    title: '我的追番',
                    headerShown: true,
                    header: ({ options }) => <CompactHeader options={options} />,
                    tabBarIcon: MyFollowsIcon,
                })}
            />
            <Tabs.Screen
                name="data-management"
                options={() => ({
                    title: '数据管理',
                    headerShown: true,
                    header: ({ options }) => <CompactHeader options={options} />,
                    tabBarIcon: SettingsIcon,
                })}
            />
        </Tabs>
    )
}

function IndexIcon({ color }: { color: ColorValue; focused: boolean }) {
    return <Icon name="CalendarClock" color={color} />
}
function MyFollowsIcon({ color }: { color: ColorValue; focused: boolean }) {
    return <Icon name="Heart" color={color} />
}
function SettingsIcon({ color }: { color: ColorValue; focused: boolean }) {
    return <Icon name="Settings" color={color} />
}
