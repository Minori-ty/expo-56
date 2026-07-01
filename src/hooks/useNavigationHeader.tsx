import { useNavigation } from 'expo-router'
import { useLayoutEffect } from 'react'

import { CompactHeader } from '@/components/ui/CompactHeader'

/**
 * 设置带返回按钮的 CompactHeader。
 *
 * addAnime / editAnime 原本各自手写 navigation.setOptions + CompactHeader，
 * editAnime 还误用了 useEffect（应为 useLayoutEffect，避免 header 闪屏）。
 */
export function useNavigationHeader(title: string) {
    const navigation = useNavigation()
    useLayoutEffect(() => {
        navigation.setOptions({
            title,
            header: ({
                options,
                navigation,
            }: {
                options: Record<string, unknown>
                navigation: { goBack: () => void }
            }) => <CompactHeader options={options} back navigation={navigation} />,
        })
    }, [navigation, title])
}
