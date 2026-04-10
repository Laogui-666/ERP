'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { liquidSpringConfig } from '@design-system/theme/animations'

const TESTIMONIALS = [
  {
    name: '张女士',
    initial: '张',
    country: '日本',
    rating: 5,
    text: '第一次办签证什么都不懂，华夏签证的申请表助手帮了大忙，3天就出签了！非常推荐！',
    color: 'from-purple-500/20 to-purple-500/5',
  },
  {
    name: '李先生',
    initial: '李',
    country: '申根',
    rating: 5,
    text: '之前被拒签过一次，用了签证评估工具分析原因后重新申请，顺利通过。专业！',
    color: 'from-blue-500/20 to-blue-500/5',
  },
  {
    name: '王女士',
    initial: '王',
    country: '美国',
    rating: 4,
    text: '一家三口一起办的美签，进度随时可查，资料员还会提醒补充材料，省心很多。',
    color: 'from-teal-500/20 to-teal-500/5',
  },
]

export function Testimonials() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setActive((p) => (p + 1) % TESTIMONIALS.length), 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-glass-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-glass-secondary/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-8">
        <motion.div 
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={liquidSpringConfig.gentle}
        >
          <span className="inline-block px-4 py-1.5 rounded-glass-sm glass-card mb-4">
            用户评价
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-glass-text-primary tracking-tight mb-3 glass-text-gradient">
            用户怎么说
          </h2>
          <p className="text-base text-glass-text-secondary">
            来自真实用户的评价
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...liquidSpringConfig.gentle, delay: i * 0.1 }}
              className={`p-6 rounded-glass-lg glass-card transition-all duration-500 ${
                i === active 
                  ? 'shadow-glass-strong' 
                  : 'shadow-glass-medium'
              }`}
            >
              {/* 头像 + 星级 */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-glass-sm bg-gradient-to-br ${t.color}`}>
                  <span className="text-base font-semibold text-glass-text-primary">{t.initial}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-glass-text-primary">{t.name}</p>
                  <div className="flex gap-0.5 mt-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <svg key={j} className={`w-3.5 h-3.5 ${j < t.rating ? 'text-glass-warning' : 'text-glass-text-muted/20'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <span className="px-3 py-1 rounded-glass-sm glass-card text-xs text-glass-text-muted">
                  {t.country}
                </span>
              </div>
              {/* 评价内容 */}
              <p className="text-sm leading-relaxed text-glass-text-primary/80">
                &ldquo;{t.text}&rdquo;
              </p>
            </motion.div>
          ))}
        </div>

        {/* 指示点 */}
        <div className="mt-8 flex justify-center gap-2">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === active ? 'w-6 bg-glass-primary' : 'w-2 bg-glass-text-muted/20'}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
