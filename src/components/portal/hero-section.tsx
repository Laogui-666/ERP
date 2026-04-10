'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { liquidSpringConfig } from '@design-system/theme/animations'

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center overflow-hidden">
      {/* 背景渐变 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-white" />
      
      {/* 装饰性背景元素 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 大圆形装饰 */}
        <motion.div 
          className="absolute -top-40 -right-40 w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full bg-gradient-to-br from-liquid-ocean/10 to-liquid-oceanLight/5 blur-3xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <motion.div 
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full bg-gradient-to-tr from-liquid-sand/10 to-liquid-ocean/5 blur-3xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
        />
        
        {/* 网格背景 */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px] md:bg-[size:80px_80px]" />
      </div>

      {/* 内容 */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8 lg:px-12 py-20 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* 左侧文字内容 */}
          <div className="text-center lg:text-left">
            {/* 标签 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...liquidSpringConfig.gentle, delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-glass-sm glass-card mb-6 md:mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-glass-accent animate-pulse" />
              <span className="text-sm font-medium text-glass-text-muted">专业签证服务平台</span>
            </motion.div>

            {/* 主标题 */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...liquidSpringConfig.gentle, delay: 0.4 }}
              className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-glass-text-primary leading-tight mb-6"
            >
              让签证办理
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-glass-primary to-glass-secondary">
                更简单高效
              </span>
            </motion.h1>

            {/* 副标题 */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...liquidSpringConfig.gentle, delay: 0.5 }}
              className="text-lg md:text-xl text-glass-text-secondary max-w-xl mx-auto lg:mx-0 mb-8 md:mb-10 leading-relaxed"
            >
              华夏签证提供一站式签证服务，覆盖全球100+国家和地区。
              专业团队、智能系统、全程跟踪，让您的出行无忧。
            </motion.p>

            {/* CTA按钮 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...liquidSpringConfig.gentle, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link
                href="/services"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-glass-text-primary glass-button glass-button-primary hover:shadow-glass-medium hover:scale-105 transition-all duration-300"
              >
                开始办理签证
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/portal/tools"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-glass-text-primary glass-button hover:shadow-glass-medium transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                签证工具箱
              </Link>
            </motion.div>

            {/* 统计数据 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...liquidSpringConfig.gentle, delay: 0.7 }}
              className="flex flex-wrap justify-center lg:justify-start gap-8 md:gap-12 mt-12 md:mt-16 pt-8 border-t glass-divider"
            >
              {[
                { value: '100+', label: '覆盖国家' },
                { value: '50,000+', label: '成功办理' },
                { value: '99%', label: '通过率' },
                { value: '24h', label: '快速响应' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...liquidSpringConfig.gentle, delay: 0.8 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-2xl md:text-3xl font-bold text-glass-text-primary">{stat.value}</div>
                  <div className="text-sm text-glass-text-muted mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* 右侧视觉内容 */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...liquidSpringConfig.gentle, delay: 0.5 }}
            className="hidden lg:block relative"
          >
            {/* 主卡片 */}
            <div className="relative">
              {/* 背景光晕 */}
              <div className="absolute -inset-4 bg-gradient-to-r from-liquid-ocean/20 to-liquid-sand/20 rounded-[2.5rem] blur-2xl" />
              
              {/* 卡片内容 */}
              <div className="relative p-8 rounded-glass-lg glass-card shadow-glass-strong">
                {/* 卡片头部 */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-glass-sm bg-glass-primary/10 flex items-center justify-center shadow-glass-medium border border-glass-primary/30">
                    <svg className="w-7 h-7 text-glass-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-glass-text-primary">签证进度实时追踪</h3>
                    <p className="text-sm text-glass-text-muted">随时掌握申请状态</p>
                  </div>
                </div>

                {/* 进度步骤 */}
                <div className="space-y-4">
                  {[
                    { step: '1', title: '提交申请', desc: '填写信息并上传材料', status: 'completed' },
                    { step: '2', title: '资料审核', desc: '专业团队审核材料', status: 'completed' },
                    { step: '3', title: '递交使馆', desc: '代送签证中心/使馆', status: 'current' },
                    { step: '4', title: '出签通知', desc: '签证结果及时通知', status: 'pending' },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-glass-sm flex items-center justify-center text-sm font-bold ${
                        item.status === 'completed' 
                          ? 'bg-glass-accent text-glass-text-primary' 
                          : item.status === 'current'
                          ? 'bg-glass-primary text-glass-text-primary'
                          : 'bg-glass-bg-card text-glass-text-muted'
                      }`}>
                        {item.status === 'completed' ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          item.step
                        )}
                      </div>
                      <div className="flex-1 pb-4 border-b glass-divider last:border-0">
                        <h4 className={`font-semibold ${
                          item.status === 'pending' ? 'text-glass-text-muted' : 'text-glass-text-primary'
                        }`}>{item.title}</h4>
                        <p className="text-sm text-glass-text-secondary">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 底部状态 */}
                <div className="mt-6 p-4 rounded-glass-sm glass-card glass-info">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-glass-sm bg-glass-primary/10 flex items-center justify-center">
                        <span className="text-lg">🇯🇵</span>
                      </div>
                      <div>
                        <p className="font-medium text-glass-text-primary">日本旅游签证</p>
                        <p className="text-xs text-glass-text-muted">预计3-5个工作日出签</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium text-glass-primary bg-glass-primary/10 rounded-glass-sm">
                      处理中
                    </span>
                  </div>
                </div>
              </div>

              {/* 浮动装饰卡片 */}
              <motion.div
                className="absolute -top-6 -right-6 p-4 rounded-glass-sm glass-card shadow-glass-medium"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-glass-sm bg-glass-accent/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-glass-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-glass-text-primary">资料审核通过</p>
                    <p className="text-xs text-glass-text-muted">2分钟前</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute -bottom-4 -left-4 p-4 rounded-glass-sm glass-card shadow-glass-medium"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <p className="text-sm font-semibold text-glass-text-primary">恭喜出签！</p>
                    <p className="text-xs text-glass-text-muted">美国签证已通过</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 底部渐变过渡 */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  )
}
