'use client'

import { motion } from 'framer-motion'
import { liquidSpringConfig } from '@design-system/theme/animations'

const STEPS = [
  { icon: '📋', title: '提交申请', desc: '填写基本信息，选择目标国家' },
  { icon: '📄', title: '准备资料', desc: '按智能清单准备，资料员协助审核' },
  { icon: '✈️', title: '递交办理', desc: '操作员制作材料，递交使馆' },
  { icon: '🎉', title: '顺利出签', desc: '进度实时可查，出签即时通知' },
]

export function HowItWorks() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-gradient-to-r from-glass-primary/5 to-transparent rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-72 h-72 bg-gradient-to-l from-glass-secondary/5 to-transparent rounded-full blur-3xl -translate-y-1/2" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 md:px-8">
        <motion.div 
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={liquidSpringConfig.gentle}
        >
          <span className="inline-block px-4 py-1.5 rounded-glass-sm glass-card mb-4">
            服务流程
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-glass-text-primary tracking-tight mb-3 glass-text-gradient">
            四步搞定签证
          </h2>
          <p className="text-base text-glass-text-secondary">
            简单流程，全程透明
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...liquidSpringConfig.gentle, delay: i * 0.1 }}
              className="relative text-center"
            >
              {/* 步骤编号 */}
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-glass-sm bg-gradient-to-br from-glass-primary/15 to-glass-secondary/10 border border-glass-border-light transition-transform duration-500 hover:scale-110">
                <span className="text-2xl">{step.icon}</span>
              </div>
              <p className="text-xs text-glass-primary font-medium mb-1">步骤 {i + 1}</p>
              <h3 className="text-base font-semibold text-glass-text-primary">{step.title}</h3>
              <p className="mt-1 text-sm text-glass-text-muted leading-relaxed">{step.desc}</p>

              {/* 连接线（非最后一步） */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-8 -right-4 w-8">
                  <svg className="w-full h-[2px]" viewBox="0 0 32 2">
                    <line x1="0" y1="1" x2="32" y2="1" stroke="rgba(168,184,200,0.2)" strokeWidth="1" strokeDasharray="4 3" />
                  </svg>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
