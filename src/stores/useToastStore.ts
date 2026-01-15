import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration: number
}

interface ToastState {
  toasts: Toast[]
  showToast: (message: string, type?: ToastType, duration?: number) => string
  removeToast: (id: string) => void
  success: (message: string, duration?: number) => string
  error: (message: string, duration?: number) => string
  info: (message: string, duration?: number) => string
  warning: (message: string, duration?: number) => string
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  showToast: (message, type = 'info', duration = 4000) => {
    const id = Date.now().toString()
    const toast: Toast = { id, message, type, duration }

    set((state) => ({ toasts: [...state.toasts, toast] }))

    setTimeout(() => {
      get().removeToast(id)
    }, duration)

    return id
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },

  success: (message, duration) => {
    return get().showToast(message, 'success', duration)
  },

  error: (message, duration) => {
    return get().showToast(message, 'error', duration)
  },

  info: (message, duration) => {
    return get().showToast(message, 'info', duration)
  },

  warning: (message, duration) => {
    return get().showToast(message, 'warning', duration)
  },
}))

