import * as Haptics from 'expo-haptics'
import { type PressableProps } from 'react-native'

import { Pressable } from '@/tw'

type Props = Omit<PressableProps, 'ref'>

export function HapticTab(props: Props) {
    return (
        <Pressable
            {...props}
            onPressIn={(ev) => {
                if (process.env.EXPO_OS === 'ios') {
                    // Add a soft haptic feedback when pressing down on the tabs.
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                }
                props.onPressIn?.(ev)
            }}
        />
    )
}
