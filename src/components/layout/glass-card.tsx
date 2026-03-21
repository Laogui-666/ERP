'use client'

import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  intensity?: 'light' | 'medium' | 'heavy'
  hover?: boolean
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, intensity = 'medium', hover = false, children, ...props }, ref) => {
    const intensities = {
      light: 'bg-white/5 border-white/10',
      medium: 'bg-white/10 border-white/15',
      heavy: 'bg-white/15 border-white/20',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border backdrop-blur-md',
          intensities[intensity],
          hover && 'hover:bg-white/15 transition-all duration-300 hover:shadow-lg',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)

GlassCard.displayName = 'GlassCard'
export { GlassCard }
