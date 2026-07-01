import { createContext, type ReactNode, useCallback, useContext, useState } from 'react'

export type ModalOptions = {
    title?: string
    body: ReactNode
    onConfirm?: () => void
    onClose?: () => void
}

interface ModalContextValue {
    show: (options: ModalOptions) => void
    hide: () => void
}

const ModalContext = createContext<ModalContextValue | null>(null)

/**
 * 获取命令式 modal 控制方法
 *
 * 必须在 ModalProvider 内部调用。
 */
export function useModal() {
    const ctx = useContext(ModalContext)
    if (!ctx) throw new Error('useModal must be used within ModalProvider')
    return ctx
}

/**
 * Modal 状态管理 hook
 *
 * 抽取 pure state logic，让 Provider 和 ModalComponent 共用。
 */
export function useModalState() {
    const [{ options, visible }, setState] = useState<{
        options: ModalOptions | null
        visible: boolean
    }>({ options: null, visible: false })

    const show = useCallback((opts: ModalOptions) => {
        setState({ options: opts, visible: true })
    }, [])

    const hide = useCallback(() => {
        setState((prev) => ({ ...prev, visible: false }))
    }, [])

    return { options, visible, show, hide }
}

export function ModalProvider({
    children,
    state,
}: {
    children: ReactNode
    state: ReturnType<typeof useModalState>
}) {
    return <ModalContext.Provider value={{ show: state.show, hide: state.hide }}>{children}</ModalContext.Provider>
}
