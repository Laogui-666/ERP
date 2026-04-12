'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { liquidSpringConfig } from '@design-system/theme/animations'

export function HeroSection() {
  const scrollToServices = () => {
    const servicesSection = document.getElementById('services')
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative min-h-screen w-full flex flex-col bg-transparent">
      {/* 内容 */}
      <div className="relative z-10 flex flex-col h-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pt-20 md:pt-24 pb-8">
        {/* 标题区域 */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...liquidSpringConfig.snappy, delay: 0.1 }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-morandi-deep mb-2 md:mb-3">
            <span className="hidden md:block">华夏·盼达</span>
            <span className="md:hidden">华夏·盼达</span>
            <span className="hidden md:block text-morandi-ocean block">一站式签证服务平台</span>
            <span className="md:hidden text-morandi-ocean text-lg block whitespace-nowrap">一站式签证服务平台</span>
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
          transition={{ delay: 0.2 }}
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
              transition={{ ...liquidSpringConfig.ultra, delay: 0.3 + index * 0.05 }}
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
          transition={{ ...liquidSpringConfig.ultra, delay: 0.4 }}
        >
          <Link 
            href="/services" 
            className="px-6 py-3 text-sm font-semibold text-glass-text-primary glass-button glass-button-primary hover:shadow-glass-medium hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            签证代办
            <svg className="w-5 h-5 transition-transform duration-200 hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <button 
            onClick={scrollToServices}
            className="px-6 py-3 text-sm font-semibold text-glass-text-primary glass-button glass-button-primary hover:shadow-glass-medium hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            签证工具箱
          </button>
        </motion.div>
        
        {/* 热门目的地 */}
        <motion.div
          className="mt-8 md:mt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...liquidSpringConfig.snappy, delay: 0.5 }}
        >
          <h2 className="text-xl md:text-2xl font-semibold text-morandi-deep text-center mb-6">
            热门目的地
          </h2>
          
          {/* 国家卡片网格 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 max-w-6xl mx-auto">
            {[
              { id: 1, name: '日本', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=300&q=75', visaType: '电子签', price: '¥599', description: '樱花之国，现代与传统完美融合' },
              { id: 2, name: '韩国', image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=300&q=75', visaType: '电子签', price: '¥399', description: '时尚之都，潮流与美食并存' },
              { id: 3, name: '申根', image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=300&q=75', visaType: '申根签', price: '¥358', description: '浪漫之都，品味多元文化' },
              { id: 4, name: '英国', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=300&q=75', visaType: '标准签', price: '¥1299', description: '日不落帝国，绅士与文化的殿堂' },
              { id: 5, name: '澳大利亚', image: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=300&q=75', visaType: '电子签', price: '¥1399', description: '神奇大陆自然之美' },
              { id: 6, name: '加拿大', image: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=300&q=75', visaType: '电子签', price: '¥1099', description: '枫叶之国，壮美自然风光' },
              { id: 7, name: '美国', image: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=300&q=75', visaType: '十年签', price: '¥1599', description: '自由之地，梦想与机遇之城' },
              { id: 8, name: '泰国', image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=300&q=75', visaType: '落地签', price: '¥299', description: '微笑之国，海岛风情等你探索' },
            ].map((dest, index) => (
              <a href={`/services?destination=${dest.id}`} key={dest.id} className="group">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...liquidSpringConfig.snappy, delay: 0.9 + index * 0.05 }}
                  whileHover={{}}
                  whileTap={{
                    y: 0,
                    scale: 0.98,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                  }}
                  transition={{
                    duration: 0.25,
                    ease: 'easeOut'
                  }}
                  className="bg-white rounded-2xl overflow-hidden shadow-glass-medium text-center cursor-pointer hover:shadow-glass-strong"
                >
                  {/* 图片区域 */}
                  <div className="relative h-20 md:h-24 overflow-hidden">
                    <div className="w-full h-full transition-transform duration-200 md:group-hover:scale-115">
                      <img
                        src={dest.image}
                        alt={dest.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-2 left-3 text-white font-bold text-base md:text-lg">
                      {dest.name}
                    </div>
                  </div>
                  {/* 信息区域 */}
                  <div className="p-2 md:p-3 bg-white">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] md:text-xs bg-morandi-ocean/10 text-morandi-ocean px-2 py-0.5 rounded-full">
                        {dest.visaType}
                      </span>
                      <span className="text-xs md:text-sm font-bold text-morandi-deep">
                        {dest.price}
                      </span>
                    </div>
                    <p className="text-[10px] md:text-xs text-morandi-mist truncate">
                      {dest.description}
                    </p>
                  </div>
                </motion.div>
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
