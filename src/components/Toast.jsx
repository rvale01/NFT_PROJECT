import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useToastStore } from '../stores/useToastStore'

const Toast = ({ toast }) => {
  const removeToast = useToastStore((state) => state.removeToast)

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  }

  const Icon = icons[toast.type] || Info

  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        removeToast(toast.id)
      }, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast, removeToast])

  return (
    <div
      className={`
        ${styles[toast.type] || styles.info}
        border rounded-xl p-4 shadow-lg
        flex items-start gap-3
        animate-slide-in
        max-w-md
      `}
    >
      <Icon className="flex-shrink-0 mt-0.5" size={20} />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
      >
        <X size={18} />
      </button>
    </div>
  )
}

const ToastContainer = () => {
  const toasts = useToastStore((state) => state.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} />
        </div>
      ))}
    </div>
  )
}

export default ToastContainer


