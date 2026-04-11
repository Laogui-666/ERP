'use client'

import { motion } from 'framer-motion'
import { liquidSpringConfig } from '@design-system/theme/animations'

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
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-glass-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-glass-secondary/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-8">
        <motion.div 
          className="text-center mb-10 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={liquidSpringConfig.gentle}
        >
          <span className="inline-block px-4 py-1.5 rounded-glass-sm glass-card mb-4">
            全球覆盖
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-glass-text-primary tracking-tight mb-3 glass-text-gradient">
            热门目的地
          </h2>
          <p className="text-base text-glass-text-secondary">
            覆盖 50+ 国家，专业签证服务
          </p>
        </motion.div>

        {/* 横向滚动 */}
        <div className="-mx-4 px-4 overflow-x-auto glass-scrollbar snap-x snap-mandatory pb-4">
          <div className="flex gap-4 md:gap-6">
            {DESTINATIONS.map((d, i) => (
              <motion.div
                key={d.country}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ ...liquidSpringConfig.gentle, delay: i * 0.08 }}
                className="flex-shrink-0 snap-start w-[180px] md:w-[220px]"
              >
                <div
                  className={`h-[260px] md:h-[300px] rounded-glass-lg glass-card p-5 flex flex-col cursor-pointer`}
                >
                  {/* 国旗 */}
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-5xl md:text-6xl">{d.flag}</span>
                  </div>

                  {/* 分隔线 */}
                  <div className="h-px glass-divider my-3" />

                  {/* 信息 */}
                  <div>
                    <p className="text-base font-semibold text-glass-text-primary">
                      {d.country} <span className="font-normal text-glass-text-muted">{d.type}</span>
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-glass-text-muted">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {d.days}
                    </div>
                    <p className="mt-2 text-xl font-bold text-glass-primary">
                      ¥{d.price} <span className="text-xs font-normal text-glass-text-muted">起</span>
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="mt-3">
                    <span className="text-sm text-glass-primary font-medium flex items-center gap-1">
                      立即办理 
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
