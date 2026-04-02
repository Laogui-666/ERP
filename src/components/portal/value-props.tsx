'use client'

import { useEffect, useRef, useState } from 'react'

const PROPS = [
  { icon: '⚡', title: '极速出签', value: '1天', desc: '最快1个工作日出签，不让等待耽误行程' },
  { icon: '🔒', title: '安全可靠', value: '0', desc: '零信息泄露，资料加密存储，隐私全面保护' },
  { icon: '💰', title: '价格透明', value: '0', desc: '零隐藏收费，所有费用提前公示，明明白白消费' },
  { icon: '🤖', title: '智能辅助', value: 'AI', desc: 'AI签证评估、智能表格填写、自动化流程驱动' },
]

export function ValueProps() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section ref={ref} className="py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className={`text-center transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-[22px] md:text-[28px] font-bold text-[var(--color-text-primary)] tracking-tight">
            为什么选择华夏签证
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {PROPS.map((p, i) => (
            <div
              key={p.title}
              className={`glass-card p-5 text-center transition-all duration-500 hover:-translate-y-1 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/15 to-[var(--color-accent)]/10">
                <span className="text-[20px]">{p.icon}</span>
              </div>
              <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">{p.title}</h3>
              <p className="mt-1 text-[28px] font-bold text-[var(--color-primary)]">{p.value}</p>
              <p className="mt-1 text-[12px] text-[var(--color-text-secondary)] leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
