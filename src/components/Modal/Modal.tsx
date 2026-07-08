import { Platform, Pressable, Modal as RNModal, Text, View } from 'react-native'

import { useModalState } from './index'

export function ModalComponent({ state }: { state: ReturnType<typeof useModalState> }) {
    const { options, visible, hide } = state

    function handleClose() {
        options?.onClose?.()
        hide()
    }

    function handleConfirm() {
        hide()
        options?.onConfirm?.()
    }

    return (
        <RNModal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={handleClose}
            statusBarTranslucent={Platform.OS === 'android'}
        >
            <View className="flex-1">
                <Pressable
                    className="flex-1 items-center justify-center px-8"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
                    onPress={handleClose}
                >
                    {/* 阻止事件冒泡到外层 */}
                    <Pressable>
                        <View className="w-80 rounded-3xl bg-white px-5 pt-8 pb-9">
                            <Text className="mb-4 text-xl font-bold">{options?.title ?? '确认删除'}</Text>
                            {options?.body}
                            <View className="mt-5 flex-row justify-end gap-4">
                                <Pressable onPress={handleClose} className="h-7 w-16 items-center justify-center">
                                    <Text className="text-base text-theme">取消</Text>
                                </Pressable>
                                <Pressable onPress={handleConfirm} className="h-7 w-16 items-center justify-center">
                                    <Text className="text-base text-theme">删除</Text>
                                </Pressable>
                            </View>
                        </View>
                    </Pressable>
                </Pressable>
            </View>
        </RNModal>
    )
}
