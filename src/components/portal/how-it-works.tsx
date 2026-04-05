'use client'

import { useEffect, useRef, useState } from 'react'

const STEPS = [
  { icon: '📋', title: '提交申请', desc: '填写基本信息，选择目标国家' },
  { icon: '📄', title: '准备资料', desc: '按智能清单准备，资料员协助审核' },
  { icon: '✈️', title: '递交办理', desc: '操作员制作材料，递交使馆' },
  { icon: '🎉', title: '顺利出签', desc: '进度实时可查，出签即时通知' },
]

export function HowItWorks() {
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
    <section ref={ref} className="py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className={`text-center transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-[22px] md:text-[28px] font-bold text-[var(--color-text-primary)] tracking-tight">
            四步搞定签证
          </h2>
          <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
            简单流程，全程透明
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className={`relative text-center transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              {/* 步骤编号 */}
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/15 to-[var(--color-accent)]/10 border border-white/[0.06]">
                <span className="text-[22px]">{step.icon}</span>
              </div>
              <p className="text-[11px] text-[var(--color-primary)] font-medium mb-1">步骤 {i + 1}</p>
              <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">{step.title}</h3>
              <p className="mt-1 text-[12px] text-[var(--color-text-secondary)] leading-relaxed">{step.desc}</p>

              {/* 连接线（非最后一步） */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-7 -right-3 w-6">
                  <svg className="w-full h-[2px]" viewBox="0 0 24 2">
                    <line x1="0" y1="1" x2="24" y2="1" stroke="rgba(124,141,166,0.2)" strokeWidth="1" strokeDasharray="4 3"
                      className={visible ? 'animate-draw-line' : ''} style={{ strokeDashoffset: visible ? 0 : 24 }} />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
