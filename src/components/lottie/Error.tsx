import LottieView from 'lottie-react-native'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface IFallbackProps {
    error: {
        message: string
    }
}
export default function Error({ error }: IFallbackProps) {
    return (
        <View style={styles.container}>
            <LottieView source={require('@/assets/lottie/error.json')} autoPlay loop style={styles.lottie} />
            <Text>{error.message}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1, // 占满整个屏幕
        justifyContent: 'center', // 垂直居中
        alignItems: 'center', // 水平居中
        backgroundColor: '#fff', // 可选：设置背景色
    },
    lottie: {
        width: 150, // 设置Lottie动画的宽度
        height: 150, // 设置Lottie动画的高度
    },
})
