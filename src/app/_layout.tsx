import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { QueryClientProvider } from '@tanstack/react-query'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin'
import { useFonts } from 'expo-font'
import { Stack, ThemeProvider } from 'expo-router'
import { DefaultTheme } from 'expo-router/react-navigation'
import { startTransition, useEffect } from 'react'
import ErrorBoundary from 'react-native-error-boundary'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import Error from '@/components/lottie/Error'
import Loading from '@/components/lottie/Loading'
import Modal from '@/components/Modal/Modal'
import { db, expo } from '@/db'
import { useAppStateRefresh } from '@/hooks/useAppStateRefresh'
import { getCalendarPermission } from '@/permissions'
import { Text } from '@/tw'
import { cleanupOrphanedCalendarEvents } from '@/utils/calendar'
import 'react-native-reanimated'

import { queryClient } from '@/utils/react-query'

import migrations from '../../drizzle/migrations'

import '../global.css'

export default function RootLayout() {
    const { success, error } = useMigrations(db, migrations)
    const [loaded] = useFonts({
        SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
    })
    useDrizzleStudio(expo)

    startTransition(() => {
        getCalendarPermission()
    })
    useAppStateRefresh()

    useEffect(() => {
        if (success) {
            cleanupOrphanedCalendarEvents()
        }
    }, [success])

    function errorHandler(error: Error) {
        console.log(error)
    }

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
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <KeyboardProvider>
                <ErrorBoundary FallbackComponent={Error} onError={errorHandler}>
                    <QueryClientProvider client={queryClient}>
                        <GestureHandlerRootView>
                            <BottomSheetModalProvider>
                                <ThemeProvider value={DefaultTheme}>
                                    <Stack>
                                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                                        <Stack.Screen name="+not-found" />
                                    </Stack>
                                    <Toast />
                                    <Modal />
                                </ThemeProvider>
                            </BottomSheetModalProvider>
                        </GestureHandlerRootView>
                    </QueryClientProvider>
                </ErrorBoundary>
            </KeyboardProvider>
        </SafeAreaView>
    )
}
