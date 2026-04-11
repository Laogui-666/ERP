'use client'


import { motion } from 'framer-motion'
import { liquidSpringConfig } from '@design-system/theme/animations'
import { LiquidButton } from '@design-system/components/liquid-button'

export function HeroSection() {
  return (
    <section className="relative min-h-screen w-full flex flex-col">
      {/* 简洁静态背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-morandi-light via-morandi-cream to-morandi-blush" />
      
      {/* 内容 */}
      <div className="relative z-10 flex flex-col h-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pt-20 md:pt-24 pb-8">
        {/* 标题区域 */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...liquidSpringConfig.gentle, delay: 0.2 }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-morandi-deep mb-3 md:mb-4">
            <span className="hidden md:block">四海无界</span>
            <span className="md:hidden">盼达旅行</span>
            <span className="hidden md:block text-morandi-ocean mt-1 block">一站畅游</span>
            <span className="md:hidden text-morandi-ocean text-lg mt-1 block whitespace-nowrap">一站式服务，轻松出境自由行</span>
          </h1>
          <p className="hidden md:block text-base sm:text-lg text-morandi-mist max-w-2xl mx-auto">
            为您提供专业的签证服务，让出境自由行变得简单从容
          </p>
        </motion.div>
        
        {/* 统计数据 */}
        <motion.div
          className="flex justify-center gap-8 md:gap-16 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {[
            { value: '50+', label: '热门国家' },
            { value: '10K+', label: '用户服务' },
            { value: '99%+', label: '成功率' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...liquidSpringConfig.medium, delay: 0.5 + index * 0.1 }}
            >
              <div className="text-2xl md:text-4xl font-bold text-morandi-ocean">{stat.value}</div>
              <div className="text-xs md:text-sm text-morandi-mist mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
        
        {/* CTA按钮 */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <LiquidButton
            variant="primary"
            size="lg"
            href="/services"
            className="group"
          >
            开始办理签证
            <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </LiquidButton>
          <LiquidButton
            variant="liquid"
            size="lg"
            href="/portal/tools"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            签证工具箱
          </LiquidButton>
        </motion.div>
      </div>
    </section>
  )
}
