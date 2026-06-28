import { Tabs } from 'expo-router'
import { ColorValue, Platform } from 'react-native'

import { HapticTab } from '@/components/HapticTab'
import { CompactHeader } from '@/components/ui/CompactHeader'
import Icon from '@/components/ui/Icon'
import TabBarBackground from '@/components/ui/TabBarBackground'
import { themeColorPurple } from '@/styles'

export default function TabLayout() {
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
