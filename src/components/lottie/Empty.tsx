import LottieView from 'lottie-react-native'
import React from 'react'
import { StyleSheet, View } from 'react-native'

export default function Empty() {
    return (
        <View className="flex-1 items-center justify-center bg-white">
            <LottieView source={require('@/assets/lottie/empty.json')} autoPlay loop style={styles.lottie} />
        </View>
    )
}

const styles = StyleSheet.create({
    lottie: {
        width: 150, // 设置Lottie动画的宽度
        height: 150, // 设置Lottie动画的高度
    },
})
