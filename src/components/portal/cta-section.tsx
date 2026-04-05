'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export function CtaSection() {
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
    <section ref={ref} className="relative py-20 md:py-28">
      {/* 渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-primary)]/8 via-[var(--color-accent)]/5 to-[var(--color-primary)]/8" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[var(--color-bg-from)] to-transparent" />

      <div className={`relative mx-auto max-w-3xl px-6 text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <h2 className="text-[24px] md:text-[32px] font-bold text-[var(--color-text-primary)] tracking-tight">
          准备好开启你的签证之旅了吗？
        </h2>
        <p className="mt-4 text-[14px] text-[var(--color-text-secondary)] leading-relaxed max-w-lg mx-auto">
          50,000+ 用户的选择，99.2% 出签率。从评估到出签，全程为你保驾护航。
        </p>
        <div className="mt-8">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] px-10 py-4 text-[15px] font-semibold text-white shadow-[0_0_40px_rgba(124,141,166,0.25)] transition-all duration-300 hover:shadow-[0_0_60px_rgba(124,141,166,0.4)] active:scale-[0.97]"
          >
            立即开始
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
