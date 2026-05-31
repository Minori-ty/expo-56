import LottieView from 'lottie-react-native'
import React from 'react'
import { StyleSheet, View } from 'react-native'

export default function Loading() {
    return (
        <View style={styles.container}>
            <LottieView source={require('@/assets/lottie/loading.json')} autoPlay loop style={styles.lottie} />
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
        width: 300, // 设置Lottie动画的宽度
        height: 300, // 设置Lottie动画的高度
    },
})
