'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { liquidSpringConfig } from '@design-system/theme/animations'

const STATS = [
  { value: 50000, suffix: '+', label: '服务用户' },
  { value: 50, suffix: '+', label: '覆盖国家' },
  { value: 99.2, suffix: '%', label: '出签率' },
  { value: 1, suffix: '天', label: '最快出签' },
]

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const [display, setDisplay] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    if (hasAnimated) return
    setHasAnimated(true)
    const duration = 1500
    const start = Date.now()
    const isFloat = !Number.isInteger(value)

    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = value * eased
      setDisplay(isFloat ? Math.round(current * 10) / 10 : Math.round(current))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [hasAnimated, value])

  return (
    <span className="text-3xl md:text-4xl lg:text-5xl font-bold text-glass-primary tabular-nums">
      {typeof display === 'number' && display % 1 !== 0 ? display.toFixed(1) : display.toLocaleString()}
      <span className="text-lg md:text-xl ml-0.5">{suffix}</span>
    </span>
  )
}

export function StatsSection() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-glass-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-glass-secondary/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...liquidSpringConfig.gentle, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="p-6 rounded-glass-lg glass-card shadow-glass-medium">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                <p className="mt-2 text-sm text-glass-text-muted">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
