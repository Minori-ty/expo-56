import { useCallback, useEffect, useRef } from 'react'

/**
 * 导航互斥锁 — 在上一次导航的转场动画完成前，阻止新的导航。
 *
 * @param unlockDelay 解锁延迟（ms），默认 500，应匹配 React Navigation 转场动画时长
 */
export function useNavigationLock(unlockDelay = 500) {
    const locked = useRef(false)
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    useEffect(() => {
        return () => clearTimeout(timer.current)
    }, [])

    const navigate = useCallback(
        (fn: () => void) => {
            if (locked.current) return
            locked.current = true
            fn()
            timer.current = setTimeout(() => {
                locked.current = false
            }, unlockDelay)
        },
        [unlockDelay],
    )

    return navigate
}
