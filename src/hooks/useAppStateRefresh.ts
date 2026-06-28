import { queryClient } from '@/utils/react-query'
import { useEffect, useState } from 'react'
import { AppState } from 'react-native'

export const useAppStateRefresh = () => {
    const [appState, setAppState] = useState(AppState.currentState)

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            console.log(appState)

            // 当应用从后台/非活跃状态切换到活跃状态时
            if (appState.match(/inactive|background/) && nextAppState === 'active') {
                // 刷新所有查询
                queryClient.invalidateQueries()
            }
            setAppState(nextAppState)
        })

        return () => subscription.remove()
    }, [appState])

    return appState
}
