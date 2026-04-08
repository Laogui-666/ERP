'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { liquidSpringConfig } from '@design-system/theme/animations'

export function CtaSection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* 渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-b from-liquid-ocean/5 via-liquid-sand/5 to-liquid-ocean/5" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />

      {/* 装饰元素 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-liquid-ocean/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-tl from-liquid-sand/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 md:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={liquidSpringConfig.gentle}
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-liquid-deep tracking-tight mb-4">
            准备好开启你的签证之旅了吗？
          </h2>
          <p className="text-base md:text-lg text-liquid-mist leading-relaxed max-w-lg mx-auto mb-8">
            50,000+ 用户的选择，99.2% 出签率。从评估到出签，全程为你保驾护航。
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-liquid-ocean to-liquid-oceanLight px-10 py-4 text-base font-semibold text-white shadow-xl shadow-liquid-ocean/25 transition-all duration-300 hover:shadow-2xl hover:shadow-liquid-ocean/30"
            >
              立即开始
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
