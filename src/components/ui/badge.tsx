'use client'

import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  size?: 'sm' | 'md'
}

const variantStyles = {
  default: 'bg-[var(--color-text-placeholder)]/15 text-[var(--color-text-secondary)] border-[var(--color-text-placeholder)]/10',
  success: 'bg-[var(--color-success)]/12 text-[var(--color-success)] border-[var(--color-success)]/15',
  warning: 'bg-[var(--color-warning)]/12 text-[var(--color-warning)] border-[var(--color-warning)]/15',
  danger: 'bg-[var(--color-error)]/12 text-[var(--color-error)] border-[var(--color-error)]/15',
  info: 'bg-[var(--color-info)]/12 text-[var(--color-info)] border-[var(--color-info)]/15',
  purple: 'bg-[var(--color-accent)]/12 text-[var(--color-accent)] border-[var(--color-accent)]/15',
}

const sizeStyles = {
  sm: 'px-2.5 py-[3px] text-[11px]',
  md: 'px-3 py-1 text-[12px]',
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'sm', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-lg border backdrop-blur-sm',
          'transition-all duration-200',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    )
  },
)

Badge.displayName = 'Badge'
export { Badge }
