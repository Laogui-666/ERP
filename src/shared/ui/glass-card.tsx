'use client'

import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@shared/lib/utils'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  intensity?: 'light' | 'medium' | 'heavy' | 'accent'
  hover?: boolean
  glow?: boolean
  animated?: boolean
  delay?: number
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, intensity = 'medium', hover = false, glow = false, animated = false, delay = 0, children, style, ...props }, ref) => {
    const intensities = {
      light: 'glass-card-light',
      medium: 'glass-card',
      heavy: 'glass-card-static',
      accent: 'glass-card-accent',
    }

    return (
      <div
        ref={ref}
        className={cn(
          intensities[intensity],
          glow && 'glass-card-glow',
          animated ? 'animate-enter-scale' : 'animate-enter-scale',
          hover && 'card-hover',
          className,
        )}
        style={{
          ...(animated && delay > 0 ? { animationDelay: `${delay}ms` } : {}),
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    )
  },
)

GlassCard.displayName = 'GlassCard'
export { GlassCard }
