'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { liquidSpringConfig } from '@design-system/theme/animations'

const tools = [
  {
    icon: '📷',
    title: '证件照制作',
    desc: '一键生成各国签证标准证件照',
    href: '/portal/tools/photo',
    color: 'from-glass-primary/20 to-glass-primary/10',
    iconBg: 'bg-glass-primary/10',
  },
  {
    icon: '📄',
    title: '表格填写助手',
    desc: '智能填写签证申请表格',
    href: '/portal/tools/form',
    color: 'from-glass-secondary/20 to-glass-secondary/10',
    iconBg: 'bg-glass-secondary/10',
  },
  {
    icon: '💱',
    title: '汇率换算',
    desc: '实时汇率查询与换算',
    href: '/portal/tools/exchange',
    color: 'from-glass-accent/20 to-glass-accent/10',
    iconBg: 'bg-glass-accent/10',
  },
  {
    icon: '📅',
    title: '行程规划',
    desc: '智能生成签证行程单',
    href: '/portal/tools/itinerary',
    color: 'from-glass-warning/20 to-glass-warning/10',
    iconBg: 'bg-glass-warning/10',
  },
]

export function ToolShowcase() {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-glass-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-glass-secondary/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
        {/* 标题区域 */}
        <div className="text-center mb-16 md:mb-20">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ...liquidSpringConfig.gentle }}
            className="inline-block px-4 py-1.5 rounded-glass-sm glass-card mb-4"
          >
            实用工具
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ...liquidSpringConfig.gentle, delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-glass-text-primary mb-4 glass-text-gradient"
          >
            签证工具箱
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ...liquidSpringConfig.gentle, delay: 0.2 }}
            className="text-lg text-glass-text-secondary max-w-2xl mx-auto"
          >
            我们提供一系列实用工具，帮助您轻松准备签证材料
          </motion.p>
        </div>

        {/* 工具卡片网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.href}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...liquidSpringConfig.gentle, delay: index * 0.1 }}
            >
              <Link
                href={tool.href}
                className="group block h-full"
              >
                <div className="relative h-full p-6 md:p-8 rounded-glass-lg glass-card shadow-glass-medium transition-all duration-500 hover:shadow-glass-strong hover:-translate-y-2 glass-card-hover overflow-hidden">
                  {/* 渐变背景 */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  {/* 内容 */}
                  <div className="relative z-10">
                    {/* 图标 */}
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-glass-sm ${tool.iconBg} flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                      <span className="text-2xl md:text-3xl">{tool.icon}</span>
                    </div>

                    {/* 标题 */}
                    <h3 className="text-xl font-bold text-glass-text-primary mb-2 transition-colors group-hover:text-glass-primary">
                      {tool.title}
                    </h3>

                    {/* 描述 */}
                    <p className="text-sm text-glass-text-muted leading-relaxed">
                      {tool.desc}
                    </p>

                    {/* 箭头 */}
                    <div className="mt-6 flex items-center gap-2 text-sm font-medium text-glass-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                      <span>立即使用</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* 查看更多 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...liquidSpringConfig.gentle, delay: 0.5 }}
          className="text-center mt-12 md:mt-16"
        >
          <Link
            href="/portal/tools"
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-glass-text-primary glass-button glass-button-primary hover:shadow-glass-medium transition-all duration-300"
          >
            查看全部工具
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
