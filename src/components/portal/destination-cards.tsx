'use client'

import { useEffect, useRef, useState } from 'react'

const DESTINATIONS = [
  { flag: '🇯🇵', country: '日本', type: '单次旅游', days: '5-7工作日', price: 599, gradient: 'from-pink-500/20 via-rose-400/10 to-transparent' },
  { flag: '🇰🇷', country: '韩国', type: '旅游签证', days: '3-5工作日', price: 399, gradient: 'from-blue-500/20 via-sky-400/10 to-transparent' },
  { flag: '🇪🇺', country: '申根', type: '旅游签证', days: '7-15工作日', price: 899, gradient: 'from-indigo-500/20 via-blue-400/10 to-transparent' },
  { flag: '🇺🇸', country: '美国', type: 'B1/B2', days: '10-15工作日', price: 1299, gradient: 'from-red-500/15 via-blue-500/10 to-transparent' },
  { flag: '🇹🇭', country: '泰国', type: '旅游签证', days: '3-5工作日', price: 299, gradient: 'from-purple-500/20 via-amber-400/10 to-transparent' },
  { flag: '🇦🇺', country: '澳大利亚', type: '旅游签证', days: '10-20工作日', price: 999, gradient: 'from-teal-500/20 via-emerald-400/10 to-transparent' },
  { flag: '🇬🇧', country: '英国', type: '标准访客', days: '10-15工作日', price: 1099, gradient: 'from-slate-500/20 via-blue-400/10 to-transparent' },
  { flag: '🇨🇦', country: '加拿大', type: '旅游签证', days: '15-20工作日', price: 1199, gradient: 'from-rose-500/15 via-red-400/10 to-transparent' },
]

export function DestinationCards() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -8
    e.currentTarget.style.transform = `perspective(1000px) rotateY(${x}deg) rotateX(${y}deg) translateZ(10px)`
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) translateZ(0)'
  }

  return (
    <section ref={ref} className="py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className={`text-center transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-[22px] md:text-[28px] font-bold text-[var(--color-text-primary)] tracking-tight">
            热门目的地
          </h2>
          <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
            覆盖 50+ 国家，专业签证服务
          </p>
        </div>

        {/* 横向滚动 */}
        <div className="mt-8 -mx-6 px-6 overflow-x-auto scrollbar-none snap-x snap-mandatory">
          <div className="flex gap-4 pb-2">
            {DESTINATIONS.map((d, i) => (
              <div
                key={d.country}
                className={`flex-shrink-0 snap-start w-[180px] md:w-[210px] transition-all duration-500 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div
                  className={`group h-[240px] md:h-[260px] rounded-2xl bg-gradient-to-br ${d.gradient} border border-white/[0.06] p-4 flex flex-col cursor-pointer transition-shadow duration-300 hover:shadow-lg`}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  style={{ transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s' }}
                >
                  {/* 国旗 */}
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-[48px]">{d.flag}</span>
                  </div>

                  {/* 分隔线 */}
                  <div className="h-px bg-white/[0.06] my-2" />

                  {/* 信息 */}
                  <div>
                    <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">
                      {d.country} <span className="font-normal text-[var(--color-text-secondary)]">{d.type}</span>
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-[var(--color-text-secondary)]">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {d.days}
                    </div>
                    <p className="mt-1.5 text-[17px] font-bold text-[var(--color-primary)]">
                      ¥{d.price} <span className="text-[11px] font-normal text-[var(--color-text-secondary)]">起</span>
                    </p>
                  </div>

                  {/* Hover CTA */}
                  <div className="mt-2 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                    <span className="text-[11px] text-[var(--color-primary)] font-medium">立即办理 →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
