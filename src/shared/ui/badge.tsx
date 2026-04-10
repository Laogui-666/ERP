'use client'

import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@shared/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  size?: 'sm' | 'md'
}

const variantStyles = {
  default: 'bg-glass-bg/30 text-glass-muted border-glass-border',
  success: 'bg-glass-success/20 text-glass-success border-glass-success/30',
  warning: 'bg-glass-warning/20 text-glass-warning border-glass-warning/30',
  danger: 'bg-glass-danger/20 text-glass-danger border-glass-danger/30',
  info: 'bg-glass-primary/20 text-glass-primary border-glass-primary/30',
  purple: 'bg-glass-accent/20 text-glass-accent border-glass-accent/30',
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
