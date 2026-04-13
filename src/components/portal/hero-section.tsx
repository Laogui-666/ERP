'use client'

import { useState, useCallback } from 'react'
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

  const [currentPage, setCurrentPage] = useState(0)

  const destinations = [
    { id: 1, name: '日本', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=300&q=75', visaType: '电子签', price: '¥599', description: '樱花之国，现代与传统完美融合' },
    { id: 2, name: '韩国', image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=300&q=75', visaType: '电子签', price: '¥399', description: '时尚之都，潮流与美食并存' },
    { id: 3, name: '法国', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=300&q=75', visaType: '申根签', price: '¥358', description: '浪漫之都，艺术与美食的天堂' },
    { id: 4, name: '意大利', image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=300&q=75', visaType: '申根签', price: '¥358', description: '艺术之国，古罗马文明的摇篮' },
    { id: 5, name: '西班牙', image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=300&q=75', visaType: '申根签', price: '¥358', description: '热情之国，弗拉门戈与斗牛的故乡' },
    { id: 6, name: '德国', image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=300&q=75', visaType: '申根签', price: '¥358', description: '工业强国，啤酒与汽车的国度' },
    { id: 7, name: '瑞士', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300&q=75', visaType: '申根签', price: '¥358', description: '阿尔卑斯之国，滑雪与巧克力天堂' },
    { id: 8, name: '英国', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=300&q=75', visaType: '标准签', price: '¥1299', description: '日不落帝国，绅士与文化的殿堂' },
    { id: 9, name: '澳大利亚', image: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=300&q=75', visaType: '电子签', price: '¥1399', description: '神奇大陆自然之美' },
    { id: 10, name: '新西兰', image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=300&q=75', visaType: '电子签', price: '¥1399', description: '纯净之国，中土世界的原型' },
    { id: 11, name: '加拿大', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&q=75', visaType: '电子签', price: '¥1099', description: '枫叶之国，壮美自然风光' },
    { id: 12, name: '美国', image: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=300&q=75', visaType: '十年签', price: '¥1599', description: '自由之地，梦想与机遇之城' },
  ]

  const firstRowDestinations = destinations.slice(0, 6)
  const secondRowDestinations = destinations.slice(6, 12)

  const itemsPerPage = 6
  const totalPages = Math.ceil(destinations.length / itemsPerPage)

  const getCurrentPageItems = useCallback(() => {
    const startIndex = currentPage * itemsPerPage
    return destinations.slice(startIndex, startIndex + itemsPerPage)
  }, [currentPage])

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => (prev + 1) % totalPages)
  }, [totalPages])

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages)
  }, [totalPages])

  const currentPageItems = getCurrentPageItems()

  return (
    <section className="relative min-h-screen w-full flex flex-col bg-transparent">
      <div className="relative z-10 flex flex-col h-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pt-20 md:pt-24 pb-8">
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 200 002-2V5a2 200 00-2-2H5a2 200 00-2 2v10a2 200 002 2z" />
            </svg>
            签证工具箱
          </button>
        </motion.div>
        
        <motion.div
          className="mt-4 md:mt-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...liquidSpringConfig.snappy, delay: 0.5 }}
        >
          <h2 className="text-xl md:text-2xl font-semibold text-morandi-deep text-center mb-6">
            热门目的地
          </h2>
          
          <div className="w-full">
            <div className="md:hidden">
              <div className="flex flex-wrap gap-3 w-full">
                {currentPageItems.map((dest) => (
                  <a 
                    href={`/services?destination=${dest.id}`} 
                    key={dest.id}
                    className="block"
                    style={{ width: 'calc(50% - 6px)' }}
                  >
                    <div className="bg-white rounded-xl overflow-hidden shadow-glass-medium text-center cursor-pointer border border-gray-100 w-full">
                      <div className="relative h-28 overflow-hidden w-full">
                        <img
                          src={dest.image}
                          alt={dest.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-2 left-2 text-white font-bold text-sm">
                          {dest.name}
                        </div>
                      </div>
                      <div className="p-2.5 bg-white w-full">
                        <div className="flex items-center justify-between mb-1 w-full">
                          <span className="text-[10px] bg-morandi-ocean/10 text-morandi-ocean px-2 py-0.5 rounded-full whitespace-nowrap overflow-hidden text-ellipsis">
                            {dest.visaType}
                          </span>
                          <span className="text-xs font-bold text-morandi-deep whitespace-nowrap">
                            {dest.price}
                          </span>
                        </div>
                        <p className="text-[10px] text-morandi-mist truncate w-full">
                          {dest.description}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
              
              <div className="flex items-center justify-center gap-4 mt-4 w-full">
                <button
                  onClick={handlePrevPage}
                  className="w-10 h-10 rounded-full bg-morandi-ocean/10 text-morandi-ocean flex items-center justify-center hover:bg-morandi-ocean/20 transition-all flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex gap-1 flex-shrink-0">
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentPage ? 'bg-morandi-ocean w-6' : 'bg-morandi-ocean/30'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={handleNextPage}
                  className="w-10 h-10 rounded-full bg-morandi-ocean/10 text-morandi-ocean flex items-center justify-center hover:bg-morandi-ocean/20 transition-all flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4 mb-4 max-w-6xl mx-auto">
                {firstRowDestinations.map((dest, index) => (
                  <a href={`/services?destination=${dest.id}`} key={dest.id} className="group">
                    <motion.div
                      initial={{ opacity: 0, y: 30, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      whileHover={{
                        y: -10,
                        scale: 1.03,
                        boxShadow: '0 20px 45px rgba(0,0,0,0.2)'
                      }}
                      whileTap={{
                        y: 0,
                        scale: 0.98,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                      }}
                      transition={{
                        ...liquidSpringConfig.snappy,
                        delay: 0.9 + index * 0.05
                      }}
                      className="bg-white rounded-2xl overflow-hidden shadow-glass-medium text-center cursor-pointer hover:shadow-glass-strong"
                    >
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
                      <div className="p-2 md:p-3 bg-white rounded-b-2xl">
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
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4 max-w-6xl mx-auto">
                {secondRowDestinations.map((dest, index) => (
                  <a href={`/services?destination=${dest.id}`} key={dest.id} className="group">
                    <motion.div
                      initial={{ opacity: 0, y: 30, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      whileHover={{
                        y: -10,
                        scale: 1.03,
                        boxShadow: '0 20px 45px rgba(0,0,0,0.2)'
                      }}
                      whileTap={{
                        y: 0,
                        scale: 0.98,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                      }}
                      transition={{
                        ...liquidSpringConfig.snappy,
                        delay: 1.1 + index * 0.05
                      }}
                      className="bg-white rounded-2xl overflow-hidden shadow-glass-medium text-center cursor-pointer hover:shadow-glass-strong"
                    >
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
                      <div className="p-2 md:p-3 bg-white rounded-b-2xl">
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
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
