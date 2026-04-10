'use client'

import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@shared/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200',
      'focus:outline-none',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'active:scale-[0.97]',
    )

    const variants = {
      primary: cn(
        'glass-button glass-button-hover text-white',
      ),
      secondary: cn(
        'glass-card glass-card-hover text-glass-primary',
      ),
      ghost: cn(
        'glass-button-hover text-glass-muted hover:text-glass-primary',
      ),
      danger: cn(
        'bg-glass-danger/90 border border-glass-danger/30 text-white hover:bg-glass-danger hover:border-glass-danger/50 shadow-lg',
      ),
      success: cn(
        'bg-glass-success/90 border border-glass-success/30 text-white hover:bg-glass-success hover:border-glass-success/50 shadow-lg',
      ),
    }

    const sizes = {
      sm: 'px-3 py-2 text-sm gap-1.5 min-h-[36px]',
      md: 'px-4 py-2.5 text-base gap-2 min-h-[44px]',
      lg: 'px-6 py-3 text-lg gap-2 min-h-[52px]',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-0.5 mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24">
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
