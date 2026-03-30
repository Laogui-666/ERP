'use client'

import { type ReactNode, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Modal({ isOpen, onClose, title, children, size = 'md', className }: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-[380px]',
    md: 'max-w-[460px]',
    lg: 'max-w-[560px]',
    xl: 'max-w-[720px]',
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="glass-modal-overlay absolute inset-0"
        onClick={onClose}
      />
      {/* Content */}
      <div
        className={cn(
          'relative w-full glass-modal p-6',
          sizes[size],
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[16px] font-semibold text-[var(--color-text-primary)] tracking-wide">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--color-text-placeholder)] hover:text-[var(--color-text-primary)] hover:bg-white/5 active:scale-90 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}
