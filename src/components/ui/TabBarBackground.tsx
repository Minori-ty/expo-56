import { View } from '@/tw'

// A simple background for the tab bar (web and Android are generally opaque).
export default function TabBarBackground() {
    return (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', backgroundColor: '#fff' }} />
    )
}

export function useBottomTabOverflow() {
    return 0
}
