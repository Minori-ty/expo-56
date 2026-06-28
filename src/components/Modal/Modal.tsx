import React, { useEffect, useState } from 'react'
import { Modal as RNModal, Platform, Pressable, StatusBar, Text, View } from 'react-native'
import { Modal, ModalOptions } from './index'

function ModalComponent() {
    const [visible, setVisible] = useState(false)
    const [options, setOptions] = useState<ModalOptions | null>(null)
    function handleClose() {
        options?.onClose?.()
        setVisible(false)
    }
    function handleConfirm() {
        setVisible(false)
        options?.onConfirm?.()
    }

    useEffect(() => {
        Modal.register({
            show(opts: ModalOptions) {
                setOptions(opts)
                setVisible(true)
            },
            hide() {
                setVisible(false)
            },
        })

        return () => {
            Modal.unregister()
        }
    }, [])

    return (
        <RNModal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={handleClose}
            statusBarTranslucent={Platform.OS === 'android'}
        >
            <Pressable
                className="absolute inset-0 flex-1 items-center justify-center bg-black/40"
                onPress={handleClose}
            >
                {/* 下面这个View包裹内容，阻止事件冒泡 */}
                <Pressable onPress={() => {}}>
                    <View pointerEvents="box-none" className="w-80 rounded-3xl bg-white px-5 pb-9 pt-8">
                        <View>
                            <Text className="mb-4 text-xl font-bold">{options?.title ?? '确认删除'}</Text>
                            {options?.body}
                        </View>
                        <View className="mt-5 flex-row justify-end">
                            <View>
                                <Pressable onPress={handleClose} className="h-7 w-16 items-center justify-center">
                                    <Text className="text-base text-theme">取消</Text>
                                </Pressable>
                            </View>
                            <View>
                                <Pressable onPress={handleConfirm} className="h-7 w-16 items-center justify-center">
                                    <Text className="text-base text-theme">删除</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </Pressable>
            </Pressable>
        </RNModal>
    )
}

export default ModalComponent
