import LottieView from 'lottie-react-native'
import { View } from 'react-native'

export default function Loading() {
    return (
        <View className="w-full flex-1 items-center justify-center bg-white">
            <LottieView
                source={require('@/assets/lottie/loading.json')}
                autoPlay
                loop
                style={{ width: 300, height: 300 }}
            />
        </View>
    )
}
