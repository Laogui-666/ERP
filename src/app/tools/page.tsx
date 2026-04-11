'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { LiquidCard } from '@design-system/components/liquid-card'
import { liquidSpringConfig } from '@design-system/theme/animations'

const TOOLS = [
  { 
    name: '签证资讯', 
    desc: '各国签证政策实时更新，出行无忧', 
    href: '/portal/tools/news', 
    color: 'from-morandi-ocean to-morandi-mist', 
    icon: '📰' 
  },
  { 
    name: '行程助手', 
    desc: 'AI 智能规划旅行路线', 
    href: '/portal/tools/itinerary', 
    color: 'from-morandi-sand to-morandi-clay', 
    icon: '🗺️' 
  },
  { 
    name: '申请表助手', 
    desc: '各国签证表智能填写，告别繁琐', 
    href: '/portal/tools/form-helper', 
    color: 'from-morandi-ocean to-morandi-blush', 
    icon: '📝' 
  },
  { 
    name: '签证评估', 
    desc: 'AI 评估通过率与拒签风险', 
    href: '/portal/tools/assessment', 
    color: 'from-morandi-mist to-morandi-ocean', 
    icon: '🔍' 
  },
  { 
    name: '翻译助手', 
    desc: '多语言即时翻译，精准专业', 
    href: '/portal/tools/translator', 
    color: 'from-morandi-sand to-morandi-ocean', 
    icon: '🌐' 
  },
  { 
    name: '证明文件', 
    desc: '在职证明、收入证明等一键生成', 
    href: '/portal/tools/documents', 
    color: 'from-morandi-blush to-morandi-ocean', 
    icon: '📄' 
  },
]

export default function ToolsPage() {
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
            <h1 className="text-2xl font-semibold text-morandi-deep">智能工具箱</h1>
            <p className="text-sm text-morandi-mist">华夏签证为你准备的旅行助手</p>
          </div>
        </div>

        {/* 工具卡片列表 */}
        <div className="space-y-4">
          {TOOLS.map((tool, index) => (
            <motion.div
              key={tool.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...liquidSpringConfig.medium, delay: index * 0.1 }}
            >
              <Link href={tool.href}>
                <LiquidCard
                  liquidIntensity="medium"
                  padding="md"
                  hoverable
                  className="group flex items-center gap-4 transition-all duration-300 hover:shadow-lg active:scale-[0.98]"
                >
                  {/* 图标 */}
                  <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.color} transition-transform duration-300 group-hover:scale-110 shadow-md`}>
                    <span className="text-2xl">{tool.icon}</span>
                  </div>

                  {/* 文字 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-morandi-deep">
                      {tool.name}
                    </h3>
                    <p className="mt-1 text-sm text-morandi-mist leading-relaxed">
                      {tool.desc}
                    </p>
                  </div>

                  {/* 箭头 */}
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-morandi-mist transition-all duration-300 group-hover:translate-x-1 group-hover:text-morandi-ocean"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </LiquidCard>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* 底部提示 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...liquidSpringConfig.medium, delay: 0.6 }}
          className="mt-8 rounded-2xl border border-white/40 bg-white/60 backdrop-blur-md p-6 text-center shadow-md"
        >
          <p className="text-base font-medium text-morandi-deep">
            💡 所有工具均可免费使用
          </p>
          <p className="mt-2 text-sm text-morandi-mist">
            登录后可保存历史记录和偏好设置
          </p>
        </motion.div>

        {/* 底部安全留白 */}
        <div className="h-8" />
      </div>
    </div>
  )
}
