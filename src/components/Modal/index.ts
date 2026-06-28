export type ModalOptions = {
    title?: string
    body: React.ReactNode
    onConfirm?: () => void
    onClose?: () => void
}

type ModalHandler = {
    show: (options: ModalOptions) => void
    hide: () => void
}

let handler: ModalHandler | null = null

export const Modal = {
    show(options: ModalOptions) {
        handler?.show(options)
    },
    hide() {
        handler?.hide()
    },
    register(modalHandler: ModalHandler) {
        handler = modalHandler
    },
    unregister() {
        handler = null
    },
}
