import LottieView from 'lottie-react-native'

import { View } from '@/tw'

export default function Empty() {
    return (
        <View className="w-full flex-1 items-center justify-center bg-white">
            <LottieView
                source={require('@/assets/lottie/empty.json')}
                autoPlay
                loop
                style={{ width: 150, height: 150 }}
            />
        </View>
    )
}
