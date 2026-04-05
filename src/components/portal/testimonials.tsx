'use client'

import { useEffect, useRef, useState } from 'react'

const TESTIMONIALS = [
  {
    name: '张女士',
    initial: '张',
    country: '日本',
    rating: 5,
    text: '第一次办签证什么都不懂，华夏签证的申请表助手帮了大忙，3天就出签了！非常推荐！',
    color: 'from-[#9B8EC4]/25 to-[#9B8EC4]/10',
  },
  {
    name: '李先生',
    initial: '李',
    country: '申根',
    rating: 5,
    text: '之前被拒签过一次，用了签证评估工具分析原因后重新申请，顺利通过。专业！',
    color: 'from-[#7C8DA6]/25 to-[#7C8DA6]/10',
  },
  {
    name: '王女士',
    initial: '王',
    country: '美国',
    rating: 4,
    text: '一家三口一起办的美签，进度随时可查，资料员还会提醒补充材料，省心很多。',
    color: 'from-[#8FA3A6]/25 to-[#8FA3A6]/10',
  },
]

export function Testimonials() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setActive((p) => (p + 1) % TESTIMONIALS.length), 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section ref={ref} className="py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className={`text-center transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-[22px] md:text-[28px] font-bold text-[var(--color-text-primary)] tracking-tight">
            用户怎么说
          </h2>
          <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
            来自真实用户的评价
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className={`glass-card p-5 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${i === active ? 'border-[var(--color-primary)]/20' : ''}`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              {/* 头像 + 星级 */}
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${t.color}`}>
                  <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">{t.initial}</span>
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{t.name}</p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <svg key={j} className={`w-3 h-3 ${j < t.rating ? 'text-amber-400' : 'text-white/10'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <span className="ml-auto rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[10px] text-[var(--color-text-secondary)] border border-white/[0.06]">
                  {t.country}
                </span>
              </div>
              {/* 评价内容 */}
              <p className="mt-4 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                &ldquo;{t.text}&rdquo;
              </p>
            </div>
          ))}
        </div>

        {/* 指示点 */}
        <div className="mt-6 flex justify-center gap-2">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? 'w-6 bg-[var(--color-primary)]' : 'w-1.5 bg-white/15'}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
