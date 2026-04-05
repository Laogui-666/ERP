'use client'

import { type HTMLAttributes, forwardRef, useRef, useCallback } from 'react'
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
    const cardRef = useRef<HTMLDivElement>(null)

    // 鼠标跟随光效（仅桌面端）
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (!glow || !cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      cardRef.current.style.setProperty('--mouse-x', `${x}%`)
      cardRef.current.style.setProperty('--mouse-y', `${y}%`)
    }, [glow])

    const intensities = {
      light: 'glass-card-light',
      medium: 'glass-card',
      heavy: 'glass-card-static',
      accent: 'glass-card-accent',
    }

    return (
      <div
        ref={(node) => {
          // 合并 refs
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
          ;(cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node
        }}
        className={cn(
          intensities[intensity],
          hover && '@media (hover: hover) { &:hover { transform: translateY(-3px) } }',
          glow && 'glass-card-glow',
          animated && 'anim-initial animate-fade-in-up',
          className,
        )}
        style={{
          ...(animated && delay > 0 ? { animationDelay: `${delay}ms` } : {}),
          ...style,
        }}
        onMouseMove={handleMouseMove}
        {...props}
      >
        {children}
      </div>
    )
  },
)

GlassCard.displayName = 'GlassCard'
export { GlassCard }
