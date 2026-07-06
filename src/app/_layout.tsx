import { BottomSheetModalProvider } from '@expo/ui/community/bottom-sheet'
import { QueryClientProvider } from '@tanstack/react-query'
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin'
import { Stack, ThemeProvider } from 'expo-router'
import { DefaultTheme } from 'expo-router/react-navigation'
import { StatusBar } from 'expo-status-bar'
import ErrorBoundary from 'react-native-error-boundary'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import Error from '@/components/lottie/Error'
import { ModalProvider, useModalState } from '@/components/Modal'
import { ModalComponent } from '@/components/Modal/Modal'
import { expo } from '@/db'
import 'react-native-reanimated'

import { useAppStateRefresh } from '@/hooks/useAppStateRefresh'
import { queryClient } from '@/utils/react-query'

import '../global.css'

function errorHandler(error: Error) {
    console.log(error)
}

function DrizzleStudio() {
    useDrizzleStudio(expo)
    return null
}

function Providers({ children }: { children: React.ReactNode }) {
    const modalState = useModalState()
    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
                <KeyboardProvider>
                    <ErrorBoundary FallbackComponent={Error} onError={errorHandler}>
                        <QueryClientProvider client={queryClient}>
                            <GestureHandlerRootView>
                                <BottomSheetModalProvider>
                                    <ModalProvider state={modalState}>
                                        <ThemeProvider value={DefaultTheme}>
                                            {children}
                                            <Toast />
                                            <ModalComponent state={modalState} />
                                        </ThemeProvider>
                                    </ModalProvider>
                                </BottomSheetModalProvider>
                            </GestureHandlerRootView>
                        </QueryClientProvider>
                    </ErrorBoundary>
                </KeyboardProvider>
            </SafeAreaView>
        </SafeAreaProvider>
    )
}

export default function RootLayout() {
    useAppStateRefresh()
    return (
        <Providers>
            <StatusBar style="dark" />
            {__DEV__ && <DrizzleStudio />}
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
            </Stack>
        </Providers>
    )
}
