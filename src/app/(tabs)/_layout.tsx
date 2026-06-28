import { Tabs } from 'expo-router'
import React from 'react'
import { ColorValue, Platform } from 'react-native'

import { HapticTab } from '@/components/HapticTab'
import Icon from '@/components/ui/Icon'
import TabBarBackground from '@/components/ui/TabBarBackground'
import { themeColorPurple } from '@/styles'
import { cn } from '@/utils/cn'

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: themeColorPurple,
                headerShown: false,
                tabBarButton: HapticTab as any,
                tabBarBackground: TabBarBackground,
                tabBarStyle: Platform.select({
                    ios: {
                        position: 'absolute',
                    },
                    default: {},
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
                options={{
                    title: '我的追番',
                    tabBarIcon: MyFollowsIcon,
                }}
            />
            <Tabs.Screen
                name="data-management"
                options={{
                    title: '数据管理',
                    tabBarIcon: SettingsIcon,
                }}
            />
        </Tabs>
    )
}

function IndexIcon({ focused }: { color: ColorValue; focused: boolean }) {
    return <Icon name="CalendarClock" className={cn('text-gray-500', focused && 'text-theme')} />
}
function MyFollowsIcon({ focused }: { color: ColorValue; focused: boolean }) {
    return <Icon name="Heart" className={cn('text-gray-500', focused && 'text-theme')} />
}
function SettingsIcon({ focused }: { color: ColorValue; focused: boolean }) {
    return <Icon name="Settings" className={cn('text-gray-500', focused && 'text-theme')} />
}
