import '../global.css'

import { getCalendarPermission } from '@/permissions'
import { Stack } from 'expo-router'
import { startTransition } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function RootLayout() {
    startTransition(() => {
        getCalendarPermission()
    })
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaView>
    )
}
