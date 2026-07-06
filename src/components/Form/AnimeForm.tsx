import { notificationAsync, NotificationFeedbackType } from 'expo-haptics'
import { forwardRef, useImperativeHandle } from 'react'
import { Button, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'

import TransparentLoading from '@/components/TransparentLoading'

import { FormRenderer } from './FormRenderer'
import { useAnimeForm } from './hooks/useAnimeForm'
import { useStatusEffect } from './hooks/useStatusEffect'
import type { AnimeFormValues } from './schema'

export interface IAnimeFormProps {
    onSubmit: (values: AnimeFormValues) => void | Promise<void>
    formData: AnimeFormValues
    isSubmitting?: boolean
}

export interface IAnimeFormRef {
    setNameError: (message: string) => void
}

/**
 * 动漫表单组合层 —— 替代旧 BaseForm，对外接口保持一致（forwardRef + setNameError）。
 *
 * 职责：组合 Form / Renderer / 副作用 / 提交按钮 / Loading 遮罩。
 * 不含字段级 JSX 与业务判断（已下沉到 Field 与 hooks）。
 *
 * 注意：标题/header 由各使用页面（addAnime / editAnime）自行设置，这里不再覆盖，
 * 避免自定义 header 场景下的死代码与标题错配。
 */
const AnimeForm = forwardRef<IAnimeFormRef, IAnimeFormProps>(function AnimeForm(
    { formData, onSubmit, isSubmitting = false },
    ref,
) {
    const form = useAnimeForm({
        defaultValues: formData,
        onSubmit,
        onSubmitInvalid: () => notificationAsync(NotificationFeedbackType.Error),
    })
    useStatusEffect(form, formData)

    useImperativeHandle(
        ref,
        () => ({
            setNameError: (message: string) => {
                form.setFieldMeta('name', (prev) => ({
                    ...prev,
                    errorMap: { ...prev?.errorMap, onChange: message },
                }))
            },
        }),
        [form],
    )

    return (
        <>
            <KeyboardAwareScrollView
                bottomOffset={20}
                showsVerticalScrollIndicator={false}
                style={{ paddingHorizontal: 16, backgroundColor: 'white', paddingBottom: 80 }}
            >
                <FormRenderer form={form} />
                <View className="mb-20">
                    <form.Subscribe selector={(s) => s.isSubmitting}>
                        {(formSubmitting) => (
                            <Button
                                title={isSubmitting ? '提交中...' : '提交'}
                                onPress={() => void form.handleSubmit()}
                                disabled={isSubmitting || formSubmitting}
                            />
                        )}
                    </form.Subscribe>
                </View>
            </KeyboardAwareScrollView>
            {isSubmitting ? (
                <View className="absolute inset-0 z-50 bg-white/70">
                    <TransparentLoading />
                </View>
            ) : null}
        </>
    )
})

export default AnimeForm
