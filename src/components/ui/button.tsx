'use client'

import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300',
      'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-transparent',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'active:scale-[0.97]',
    )

    const variants = {
      primary: cn(
        'glass-btn-primary focus:ring-[var(--color-primary)]/30',
      ),
      secondary: cn(
        'glass-btn-secondary focus:ring-white/10',
      ),
      ghost: cn(
        'bg-transparent text-[var(--color-text-secondary)]',
        'hover:bg-white/5 hover:text-[var(--color-text-primary)]',
        'focus:ring-white/10',
      ),
      danger: cn(
        'glass-btn-danger focus:ring-[var(--color-error)]/30',
      ),
      success: cn(
        'glass-btn-success focus:ring-[var(--color-success)]/30',
      ),
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-[12px] gap-1.5',
      md: 'px-4 py-2 text-[13px] gap-2',
      lg: 'px-6 py-2.5 text-[14px] gap-2',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-0.5 mr-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
export { Button }
