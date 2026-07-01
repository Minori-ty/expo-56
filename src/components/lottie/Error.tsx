import LottieView from 'lottie-react-native'
import { Text, View } from 'react-native'

interface IFallbackProps {
    error: {
        message: string
    }
}
export default function Error({ error }: IFallbackProps) {
    return (
        <View className="w-full flex-1 items-center justify-center bg-white">
            <LottieView
                source={require('@/assets/lottie/error.json')}
                autoPlay
                loop
                style={{ width: 150, height: 150 }}
            />
            <Text>{error.message}</Text>
        </View>
    )
}
