'use client'

import { useEffect, useRef, useState } from 'react'
import { GlassCard } from '@shared/ui/glass-card'
import { cn } from '@shared/lib/utils'

interface StatItem {
  value: number
  suffix: string
  label: string
}

const STATS: StatItem[] = [
  { value: 200, suffix: '+', label: '服务客户' },
  { value: 50, suffix: '+', label: '覆盖国家' },
  { value: 98.5, suffix: '%', label: '出签率' },
]

function AnimatedNumber({ target, suffix, isActive }: { target: number; suffix: string; isActive: boolean }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!isActive) return

    const duration = 2000
    const steps = 60
    const increment = target / steps
    let step = 0

    const timer = setInterval(() => {
      step++
      if (step >= steps) {
        setCurrent(target)
        clearInterval(timer)
        return
      }
      setCurrent(Number((increment * step).toFixed(1)))
    }, duration / steps)

    return () => clearInterval(timer)
  }, [isActive, target])

  const display = target % 1 !== 0 ? current.toFixed(1) : Math.floor(current).toString()

  return (
    <span className="text-[28px] font-bold text-[var(--color-text-primary)]">
      {display}{suffix}
    </span>
  )
}

export function StatsCounter() {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="px-4 py-8">
      <div className="mx-auto grid max-w-lg grid-cols-3 gap-3">
        {STATS.map((stat, i) => (
          <GlassCard
            key={stat.label}
            intensity="accent"
            className={cn(
              'flex flex-col items-center justify-center p-5 transition-all duration-600',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            )}
            style={{
              transitionDelay: `${i * 200}ms`,
              transitionDuration: '600ms',
            }}
          >
            <AnimatedNumber
              target={stat.value}
              suffix={stat.suffix}
              isActive={isVisible}
            />
            <span className="mt-1 text-[12px] text-[var(--color-text-secondary)]">
              {stat.label}
            </span>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
