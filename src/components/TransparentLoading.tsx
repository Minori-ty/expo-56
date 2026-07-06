import LottieView from 'lottie-react-native'
import { View } from 'react-native'

interface ITransparentLoadingProps {
    /** Loading 尺寸，默认 300 */
    size?: number
}

/**
 * 透明背景的 Loading 组件，用于覆盖层
 */
export default function TransparentLoading({ size = 300 }: ITransparentLoadingProps) {
    return (
        <View className="w-full flex-1 items-center justify-center">
            <LottieView
                source={require('@assets/lottie/loading.json')}
                autoPlay
                loop
                style={{ width: size, height: size }}
            />
        </View>
    )
}
