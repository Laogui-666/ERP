'use client'

import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@shared/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  size?: 'sm' | 'md'
}

const variantStyles = {
  default: 'bg-muted/50 text-muted-foreground border-muted',
  success: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800',
  warning: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  danger: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800',
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
