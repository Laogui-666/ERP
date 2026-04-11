'use client'

import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@shared/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  size?: 'sm' | 'md'
}

const variantStyles = {
  default: 'bg-glass-bg/30 text-glass-text-primary border-glass-border',
  success: 'bg-green-100/70 text-green-800 border-green-200',
  warning: 'bg-yellow-100/70 text-yellow-800 border-yellow-200',
  danger: 'bg-red-100/70 text-red-800 border-red-200',
  info: 'bg-blue-100/70 text-blue-800 border-blue-200',
  purple: 'bg-purple-100/70 text-purple-800 border-purple-200',
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
          'inline-flex items-center font-medium rounded-xl border backdrop-blur-sm',
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
