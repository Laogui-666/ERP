'use client'

import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { LiquidCard } from '@design-system/components/liquid-card'
import { LiquidInput } from '@design-system/components/liquid-input'
import { LiquidButton } from '@design-system/components/liquid-button'
import { useToast } from '@shared/ui/toast'
import { cn } from '@shared/lib/utils'
import { liquidSpringConfig } from '@design-system/theme/animations'

// ==================== 数据 ====================

const DESTINATIONS = [
  { flag: '🇯🇵', country: '日本', type: '单次旅游', days: '5-7工作日', price: 599, region: '亚洲' },
  { flag: '🇰🇷', country: '韩国', type: '旅游签证', days: '3-5工作日', price: 399, region: '亚洲' },
  { flag: '🇪🇺', country: '申根', type: '旅游签证', days: '7-15工作日', price: 899, region: '欧洲' },
  { flag: '🇺🇸', country: '美国', type: 'B1/B2', days: '10-15工作日', price: 1299, region: '北美' },
  { flag: '🇹🇭', country: '泰国', type: '旅游签证', days: '3-5工作日', price: 299, region: '亚洲' },
  { flag: '🇦🇺', country: '澳大利亚', type: '旅游签证', days: '10-20工作日', price: 999, region: '大洋洲' },
  { flag: '🇬🇧', country: '英国', type: '标准访客', days: '10-15工作日', price: 1099, region: '欧洲' },
  { flag: '🇨🇦', country: '加拿大', type: '旅游签证', days: '15-20工作日', price: 1199, region: '北美' },
  { flag: '🇳🇿', country: '新西兰', type: '旅游签证', days: '10-15工作日', price: 899, region: '大洋洲' },
  { flag: '🇸🇬', country: '新加坡', type: '旅游签证', days: '3-5工作日', price: 399, region: '亚洲' },
  { flag: '🇲🇾', country: '马来西亚', type: '旅游签证', days: '3-5工作日', price: 299, region: '亚洲' },
  { flag: '🇮🇹', country: '意大利', type: '申根旅游', days: '7-15工作日', price: 899, region: '欧洲' },
]

const REGIONS = ['全部', '亚洲', '欧洲', '北美', '大洋洲']

// ==================== 页面 ====================

export default function ServicesPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('全部')
  const scrollRef = useRef<HTMLDivElement>(null)



  const filtered = useMemo(() => {
    return DESTINATIONS.filter((d) => {
      const matchSearch = !search || d.country.includes(search) || d.type.includes(search)
      const matchRegion = region === '全部' || d.region === region
      return matchSearch && matchRegion
    })
  }, [search, region])

  return (
    <div className="min-h-screen bg-gradient-to-br from-morandi-light via-morandi-cream to-morandi-blush">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* 顶栏 */}
        <div className="mb-8 flex items-center gap-3">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 backdrop-blur-md border border-white/40 shadow-sm transition-colors hover:bg-white/90"
          >
            <svg className="h-5 w-5 text-morandi-mist" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-morandi-deep">签证服务</h1>
            <p className="text-sm text-morandi-mist">覆盖 50+ 国家，专业办理</p>
          </div>
        </div>

        {/* 搜索栏 */}
        <div className="mb-6 max-w-md">
          <LiquidInput
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索国家或签证类型..."
            leftIcon={
              <svg className="h-5 w-5 text-morandi-mist/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            }
            variant="liquid"
          />
        </div>

        {/* 地区筛选 Tab */}
        <div className="mb-6 -mx-4 px-4 overflow-x-auto scrollbar-none">
          <div className="flex gap-3">
            {REGIONS.map((r) => (
              <motion.button
                key={r}
                onClick={() => setRegion(r)}
                className={cn(
                  'flex-shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-all',
                  region === r
                    ? 'bg-morandi-ocean text-white shadow-md'
                    : 'bg-white/60 text-morandi-mist border border-white/40 hover:bg-white/80'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={liquidSpringConfig.ultra}
              >
                {r}
              </motion.button>
            ))}
          </div>
        </div>

        {/* 结果计数 */}
        <p className="mb-4 text-sm text-morandi-mist/60">
          共 {filtered.length} 个目的地
        </p>

        {/* 国家卡片网格 */}
        <div ref={scrollRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {filtered.length === 0 ? (
            <div className="col-span-4 flex flex-col items-center py-16">
              <span className="text-4xl">🔍</span>
              <p className="mt-3 text-base text-morandi-mist">未找到相关目的地</p>
              <p className="mt-1 text-sm text-morandi-mist/60">试试其他关键词或筛选条件</p>
              <LiquidButton
                variant="primary"
                size="sm"
                className="mt-6"
                onClick={() => {
                  setSearch('');
                  setRegion('全部');
                }}
              >
                重置筛选
              </LiquidButton>
            </div>
          ) : (
            filtered.map((d, i) => (
              <motion.div
                key={d.country}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...liquidSpringConfig.medium, delay: i * 0.1 }}
              >
                <button
                  onClick={() => toast('info', `${d.country}${d.type} — 功能开发中，即将上线`)}
                  className="w-full text-left"
                >
                  <LiquidCard
                    liquidIntensity="medium"
                    padding="md"
                    hoverable
                    className="group h-full transition-all active:scale-[0.97]"
                  >
                    {/* 国旗 */}
                    <div className="mb-4 flex items-center justify-center">
                      <span className="text-5xl">{d.flag}</span>
                    </div>

                    {/* 分隔线 */}
                    <div className="h-px bg-white/30 mb-4" />

                    {/* 信息 */}
                    <h3 className="text-lg font-bold text-morandi-deep">
                      {d.country}
                    </h3>
                    <p className="mt-1 text-sm text-morandi-mist">
                      {d.type}
                    </p>

                    {/* 出签时间 */}
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-morandi-mist">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {d.days}
                    </div>

                    {/* 价格 */}
                    <p className="mt-3 text-xl font-bold text-morandi-ocean">
                      ¥{d.price}
                      <span className="ml-1 text-xs font-normal text-morandi-mist">起</span>
                    </p>

                    {/* Hover CTA */}
                    <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-morandi-ocean opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                      立即办理
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </LiquidCard>
                </button>
              </motion.div>
            ))
          )}
        </div>

        {/* 底部安全留白 */}
        <div className="h-8" />
      </div>
    </div>
  )
}
