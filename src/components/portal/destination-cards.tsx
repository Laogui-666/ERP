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
    <section className="py-16 md:py-24 bg-white relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-liquid-ocean/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-liquid-sand/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-8">
        <motion.div 
          className="text-center mb-10 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={liquidSpringConfig.gentle}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-liquid-ocean/5 border border-liquid-ocean/10 text-sm font-medium text-liquid-ocean mb-4">
            全球覆盖
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-liquid-deep tracking-tight mb-3">
            热门目的地
          </h2>
          <p className="text-base text-liquid-mist">
            覆盖 50+ 国家，专业签证服务
          </p>
        </motion.div>

        {/* 横向滚动 */}
        <div className="-mx-4 px-4 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-4">
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
                  className={`group h-[260px] md:h-[300px] rounded-3xl bg-gradient-to-br ${d.gradient} border border-liquid-ocean/10 p-5 flex flex-col cursor-pointer transition-all duration-500 hover:shadow-xl hover:shadow-liquid-ocean/10 hover:border-liquid-ocean/20`}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  style={{ transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s, border-color 0.3s' }}
                >
                  {/* 国旗 */}
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-5xl md:text-6xl transition-transform duration-500 group-hover:scale-110">{d.flag}</span>
                  </div>

                  {/* 分隔线 */}
                  <div className="h-px bg-liquid-ocean/10 my-3" />

                  {/* 信息 */}
                  <div>
                    <p className="text-base font-semibold text-liquid-deep">
                      {d.country} <span className="font-normal text-liquid-mist">{d.type}</span>
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-liquid-mist">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {d.days}
                    </div>
                    <p className="mt-2 text-xl font-bold text-liquid-ocean">
                      ¥{d.price} <span className="text-xs font-normal text-liquid-mist">起</span>
                    </p>
                  </div>

                  {/* Hover CTA */}
                  <div className="mt-3 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                    <span className="text-sm text-liquid-ocean font-medium flex items-center gap-1">
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
