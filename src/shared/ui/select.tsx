'use client'

import { type SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '@shared/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string
  error?: string
  options: SelectOption[]
  onChange?: (value: string) => void
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, onChange, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[12px] font-medium text-liquid-mist mb-1.5 tracking-wide uppercase"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'glass-input w-full appearance-none cursor-pointer pr-10',
              error && 'border-liquid-ruby/40 animate-shake',
              className,
            )}
            onChange={(e) => onChange?.(e.target.value)}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-liquid-deep text-liquid-light">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="w-3.5 h-3.5 text-liquid-mist/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && <p className="mt-1.5 text-[12px] text-liquid-ruby">{error}</p>}
      </div>
    )
  },
)

Select.displayName = 'Select'
export { Select }
