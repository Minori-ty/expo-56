import '../global.css'

import { getCalendarPermission } from '@/permissions'
import { Stack } from 'expo-router'
import { startTransition } from 'react'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function RootLayout() {
    startTransition(() => {
        getCalendarPermission()
    })
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <KeyboardProvider>
                <Stack screenOptions={{ headerShown: false }} />
            </KeyboardProvider>
        </SafeAreaView>
    )
}
