'use client'

import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@shared/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-glass-primary mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-2.5 text-base border border-glass-border rounded-xl focus:outline-none focus:ring-2 focus:ring-glass-primary/30 focus:border-glass-primary transition-all duration-200',
            'glass-input text-glass-primary placeholder:text-glass-muted',
            'min-h-[48px]',
            error && 'border-glass-danger focus:ring-glass-danger/30 focus:border-glass-danger animate-shake',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-glass-danger">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-glass-muted">{helperText}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
export { Input }
