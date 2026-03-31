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
            className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-1.5 tracking-wide uppercase"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'glass-input w-full',
            error && 'border-[var(--color-error)]/40 focus:ring-[var(--color-error)]/20 animate-shake',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-[12px] text-[var(--color-error)]">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-[12px] text-[var(--color-text-placeholder)]">{helperText}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
export { Input }
