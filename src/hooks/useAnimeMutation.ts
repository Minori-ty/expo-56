import { useMutation } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { BackHandler } from 'react-native'

import { queryClient } from '@/utils/react-query'

interface UseAnimeMutationOptions<TVars> {
    /** 实际的 mutation 函数 */
    mutationFn: (vars: TVars) => Promise<unknown>
    /** mutation 成功后需要失效的 query key 列表 */
    invalidateKeys: unknown[][]
}

/**
 * 封装动漫表单提交的通用 mutation 逻辑：
 * - useMutation 的 onSuccess / onError 处理
 * - 成功后失效指定 query key + router.back()
 * - 提交中禁止 Android 返回键
 *
 * addAnime / editAnime 原各自写了 25 行重复代码，统一沉淀至此。
 */
export function useAnimeMutation<TVars>(options: UseAnimeMutationOptions<TVars>) {
    const { mutate, isPending } = useMutation({
        mutationFn: options.mutationFn,
        onSuccess: () => {
            for (const key of options.invalidateKeys) {
                queryClient.invalidateQueries({ queryKey: key })
            }
            router.back()
        },
        onError: (err) => {
            alert(err)
        },
    })

    useEffect(() => {
        if (!isPending) return
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => true)
        return () => subscription.remove()
    }, [isPending])

    return { mutate, isPending }
}
