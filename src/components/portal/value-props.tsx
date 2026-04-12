'use client'

import { motion } from 'framer-motion'
import { liquidSpringConfig } from '@design-system/theme/animations'

const PROPS = [
  { icon: '⚡', title: '极速办理', value: '2个工作日', desc: '最快加急1天交付送签材料，不让等待耽误行程' },
  { icon: '🔒', title: '安全可靠', value: '0', desc: '资料加密存储，隐私全面保护，定期销毁，信息零泄露' },
  { icon: '💰', title: '价格透明', value: '0', desc: '零隐藏收费，所有费用提前公示，明明白白消费' },
  { icon: '🤖', title: '智能辅助工具', value: 'AI', desc: '自动化流程驱动，智能工具助理签证准备' },
]

export function ValueProps() {
  return (
    <section className="py-8 md:py-12 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-glass-primary/5 to-glass-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 md:px-8">
        <motion.div 
          className="text-center mb-8 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={liquidSpringConfig.gentle}
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-glass-text-primary tracking-tight glass-text-gradient">
            为什么选择华夏签证
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {PROPS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...liquidSpringConfig.gentle, delay: i * 0.1 }}
              className="group"
            >
              <div className="h-full p-6 rounded-glass-lg glass-card shadow-glass-medium text-center transition-all duration-200 md:hover:-translate-y-2 md:hover:shadow-glass-strong glass-card-hover">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-glass-sm bg-gradient-to-br from-glass-primary/15 to-glass-secondary/10 transition-transform duration-200 md:group-hover:scale-110">
                  <span className="text-2xl">{p.icon}</span>
                </div>
                <h3 className="text-base font-semibold text-glass-text-primary mb-1">{p.title}</h3>
                <p className="text-2xl md:text-3xl font-bold text-glass-primary mb-2">{p.value}</p>
                <p className="text-xs text-glass-text-muted leading-relaxed">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
