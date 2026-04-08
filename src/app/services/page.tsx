'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { GlassCard } from '@shared/ui/glass-card'
import { useToast } from '@shared/ui/toast'
import { cn } from '@shared/lib/utils'

// ==================== 数据 ====================

const DESTINATIONS = [
  { flag: '🇯🇵', country: '日本', type: '单次旅游', days: '5-7工作日', price: 599, region: '亚洲', gradient: 'from-pink-500/20 via-rose-400/10 to-transparent' },
  { flag: '🇰🇷', country: '韩国', type: '旅游签证', days: '3-5工作日', price: 399, region: '亚洲', gradient: 'from-blue-500/20 via-sky-400/10 to-transparent' },
  { flag: '🇪🇺', country: '申根', type: '旅游签证', days: '7-15工作日', price: 899, region: '欧洲', gradient: 'from-indigo-500/20 via-blue-400/10 to-transparent' },
  { flag: '🇺🇸', country: '美国', type: 'B1/B2', days: '10-15工作日', price: 1299, region: '北美', gradient: 'from-red-500/15 via-blue-500/10 to-transparent' },
  { flag: '🇹🇭', country: '泰国', type: '旅游签证', days: '3-5工作日', price: 299, region: '亚洲', gradient: 'from-purple-500/20 via-amber-400/10 to-transparent' },
  { flag: '🇦🇺', country: '澳大利亚', type: '旅游签证', days: '10-20工作日', price: 999, region: '大洋洲', gradient: 'from-teal-500/20 via-emerald-400/10 to-transparent' },
  { flag: '🇬🇧', country: '英国', type: '标准访客', days: '10-15工作日', price: 1099, region: '欧洲', gradient: 'from-slate-500/20 via-blue-400/10 to-transparent' },
  { flag: '🇨🇦', country: '加拿大', type: '旅游签证', days: '15-20工作日', price: 1199, region: '北美', gradient: 'from-rose-500/15 via-red-400/10 to-transparent' },
  { flag: '🇳🇿', country: '新西兰', type: '旅游签证', days: '10-15工作日', price: 899, region: '大洋洲', gradient: 'from-emerald-500/20 via-teal-400/10 to-transparent' },
  { flag: '🇸🇬', country: '新加坡', type: '旅游签证', days: '3-5工作日', price: 399, region: '亚洲', gradient: 'from-red-500/20 via-rose-400/10 to-transparent' },
  { flag: '🇲🇾', country: '马来西亚', type: '旅游签证', days: '3-5工作日', price: 299, region: '亚洲', gradient: 'from-blue-500/15 via-indigo-400/10 to-transparent' },
  { flag: '🇮🇹', country: '意大利', type: '申根旅游', days: '7-15工作日', price: 899, region: '欧洲', gradient: 'from-green-500/20 via-red-400/10 to-transparent' },
]

const REGIONS = ['全部', '亚洲', '欧洲', '北美', '大洋洲']

// ==================== 页面 ====================

export default function ServicesPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('全部')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [sectionVisible, setSectionVisible] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setSectionVisible(true) },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const filtered = useMemo(() => {
    return DESTINATIONS.filter((d) => {
      const matchSearch = !search || d.country.includes(search) || d.type.includes(search)
      const matchRegion = region === '全部' || d.region === region
      return matchSearch && matchRegion
    })
  }, [search, region])

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* 顶栏 */}
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] transition-colors hover:bg-white/[0.10]"
        >
          <svg className="h-4 w-4 text-liquid-mist" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-[18px] font-semibold text-liquid-deep">签证服务</h1>
          <p className="text-[12px] text-liquid-mist">覆盖 50+ 国家，专业办理</p>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="mb-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-liquid-mist/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索国家或签证类型..."
            className="w-full rounded-xl border border-liquid-ocean/8 bg-liquid-ocean/5 py-2.5 pl-10 pr-4 text-[14px] text-liquid-deep backdrop-blur-sm placeholder:text-liquid-mist/60 focus:border-liquid-ocean/40 focus:outline-none focus:shadow-[0_0_0_3px_rgba(124,141,166,0.1)] transition-all"
          />
        </div>
      </div>

      {/* 地区筛选 Tab */}
      <div className="mb-5 -mx-4 px-4 overflow-x-auto scrollbar-none">
        <div className="flex gap-2">
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={cn(
                'flex-shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all',
                region === r
                  ? 'bg-liquid-ocean/20 text-liquid-ocean border border-liquid-ocean/30'
                  : 'bg-liquid-ocean/4 text-liquid-mist border border-liquid-ocean/6 hover:bg-liquid-ocean/8'
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* 结果计数 */}
      <p className="mb-3 text-[12px] text-liquid-mist/60">
        共 {filtered.length} 个目的地
      </p>

      {/* 国家卡片网格 */}
      <div ref={scrollRef} className="grid grid-cols-2 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center py-16">
            <span className="text-3xl">🔍</span>
            <p className="mt-2 text-[14px] text-liquid-mist">未找到相关目的地</p>
            <p className="mt-1 text-[12px] text-liquid-mist/60">试试其他关键词或筛选条件</p>
          </div>
        ) : (
          filtered.map((d, i) => (
            <div
              key={d.country}
              className={cn(
                'transition-all duration-500',
                sectionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              )}
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <button
                onClick={() => toast('info', `${d.country}${d.type} — 功能开发中，即将上线`)}
                className="w-full text-left"
              >
                <GlassCard
                  intensity="light"
                  hover
                  className={cn(
                    'group rounded-2xl bg-gradient-to-br p-4 transition-all active:scale-[0.97]',
                    d.gradient
                  )}
                >
                  {/* 国旗 */}
                  <div className="mb-3 flex items-center justify-center">
                    <span className="text-[40px]">{d.flag}</span>
                  </div>

                  {/* 分隔线 */}
                  <div className="h-px bg-white/[0.06] mb-3" />

                  {/* 信息 */}
                  <p className="text-[14px] font-semibold text-liquid-deep">
                    {d.country}
                  </p>
                  <p className="mt-0.5 text-[12px] text-liquid-mist">
                    {d.type}
                  </p>

                  {/* 出签时间 */}
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-liquid-mist">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {d.days}
                  </div>

                  {/* 价格 */}
                  <p className="mt-2 text-[17px] font-bold text-liquid-ocean">
                    ¥{d.price}
                    <span className="ml-0.5 text-[11px] font-normal text-liquid-mist">起</span>
                  </p>

                  {/* Hover CTA */}
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-liquid-ocean opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                    立即办理 →
                  </div>
                </GlassCard>
              </button>
            </div>
          ))
        )}
      </div>

      {/* 底部安全留白 */}
      <div className="h-4" />
    </div>
  )
}
