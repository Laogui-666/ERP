'use client'

import { useState, useCallback, createContext, useContext, type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@shared/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
})

export function useToast() {
  return useContext(ToastContext)
}

const iconMap: Record<ToastType, ReactNode> = {
  success: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

const colorMap: Record<ToastType, string> = {
  success: 'bg-glass-accent/10 border-glass-accent/30 text-glass-accent',
  error: 'bg-glass-danger/10 border-glass-danger/30 text-glass-danger',
  warning: 'bg-glass-warning/10 border-glass-warning/30 text-glass-warning',
  info: 'bg-glass-primary/10 border-glass-primary/30 text-glass-primary',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const toast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {isClient &&
        createPortal(
          <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-[340px]">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-glass-sm border backdrop-blur-glass shadow-glass-medium animate-fade-in-right min-w-[260px] glass-card',
                  colorMap[t.type],
                )}
              >
                <span className="shrink-0">{iconMap[t.type]}</span>
                <span className="text-[13px] font-medium leading-snug text-glass-text-primary">{t.message}</span>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  )
}
