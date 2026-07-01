import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'
import { Pressable, type PressableProps } from 'react-native'

type Props = Omit<PressableProps, 'ref'>

export function HapticTab(props: Props) {
    return (
        <Pressable
            {...props}
            onPressIn={(ev) => {
                if (process.env.EXPO_OS === 'ios') {
                    // Add a soft haptic feedback when pressing down on the tabs.
                    impactAsync(ImpactFeedbackStyle.Light)
                }
                props.onPressIn?.(ev)
            }}
        />
    )
}
