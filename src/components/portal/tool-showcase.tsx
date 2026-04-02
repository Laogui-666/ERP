'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const TOOLS = [
  { name: '签证资讯', desc: '各国签证政策实时更新', href: '/portal/tools/news', color: 'from-blue-400/20 to-cyan-400/10', icon: '📰' },
  { name: '行程助手', desc: 'AI 智能规划旅行路线', href: '/portal/tools/itinerary', color: 'from-green-400/20 to-emerald-400/10', icon: '🗺️' },
  { name: '申请表助手', desc: '各国签证表智能填写', href: '/portal/tools/form-helper', color: 'from-amber-400/20 to-orange-400/10', icon: '📝' },
  { name: '签证评估', desc: 'AI 评估通过率与风险', href: '/portal/tools/assessment', color: 'from-purple-400/20 to-violet-400/10', icon: '🔍' },
  { name: '翻译助手', desc: '多语言即时翻译', href: '/portal/tools/translator', color: 'from-pink-400/20 to-rose-400/10', icon: '🌐' },
  { name: '证明文件', desc: '在职证明等文件生成', href: '/portal/tools/documents', color: 'from-indigo-400/20 to-blue-400/10', icon: '📄' },
]

export function ToolShowcase() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section ref={ref} className="py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className={`text-center transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-[22px] md:text-[28px] font-bold text-[var(--color-text-primary)] tracking-tight">
            智能工具箱
          </h2>
          <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
            6 大工具，让签证办理更简单
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
          {TOOLS.map((tool, i) => (
            <Link
              key={tool.name}
              href={tool.href}
              className={`glass-card group p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg active:scale-[0.97] ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${tool.color} transition-transform duration-300 group-hover:scale-110`}>
                <span className="text-[18px]">{tool.icon}</span>
              </div>
              <h3 className="text-[14px] font-semibold text-[var(--color-text-primary)]">{tool.name}</h3>
              <p className="mt-1 text-[12px] text-[var(--color-text-secondary)] leading-relaxed">{tool.desc}</p>
              <div className="mt-3 flex items-center gap-1 text-[11px] text-[var(--color-primary)] opacity-0 translate-x-[-8px] transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                使用 →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
