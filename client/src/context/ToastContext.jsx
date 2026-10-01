import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((message, tone = 'info') => {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { id, message, tone }])
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 3600)
  }, [])

  const value = useMemo(() => ({
    success: (message) => push(message, 'success'),
    error: (message) => push(message, 'danger'),
    info: (message) => push(message, 'info'),
  }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full max-w-sm rounded-xl border bg-white px-4 py-3 text-sm shadow-sm ${
              toast.tone === 'danger' ? 'border-danger/30' : toast.tone === 'success' ? 'border-success/30' : 'border-line'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
