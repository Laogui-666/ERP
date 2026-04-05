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
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'active:scale-[0.97]',
    )

    const variants = {
      primary: cn(
        'bg-primary text-white hover:bg-primary-600 focus:ring-primary/30',
        'shadow-md hover:shadow-lg',
      ),
      secondary: cn(
        'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-300',
        'shadow-sm hover:shadow-md',
      ),
      ghost: cn(
        'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-200',
      ),
      danger: cn(
        'bg-danger text-white hover:bg-danger-600 focus:ring-danger/30',
        'shadow-md hover:shadow-lg',
      ),
      success: cn(
        'bg-success text-white hover:bg-success-600 focus:ring-success/30',
        'shadow-md hover:shadow-lg',
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
