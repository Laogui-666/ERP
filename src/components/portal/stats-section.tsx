'use client'

import { useEffect, useRef, useState } from 'react'

const STATS = [
  { value: 50000, suffix: '+', label: '服务用户' },
  { value: 50, suffix: '+', label: '覆盖国家' },
  { value: 99.2, suffix: '%', label: '出签率' },
  { value: 1, suffix: '天', label: '最快出签' },
]

function AnimatedNumber({ value, suffix, visible }: { value: number; suffix: string; visible: boolean }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!visible) return
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
  }, [visible, value])

  return (
    <span className="text-[32px] md:text-[40px] font-bold text-[var(--color-primary)] tabular-nums">
      {typeof display === 'number' && display % 1 !== 0 ? display.toFixed(1) : display.toLocaleString()}
      <span className="text-[18px] md:text-[22px] ml-0.5">{suffix}</span>
    </span>
  )
}

export function StatsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section ref={ref} className="py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={`text-center transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <AnimatedNumber value={stat.value} suffix={stat.suffix} visible={visible} />
              <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
