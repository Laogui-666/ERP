'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { AppNavbar } from '@/components/portal/app-navbar'
import { HeroSection } from '@/components/portal/hero-section'
import { ToolShowcase } from '@/components/portal/tool-showcase'
import { ValueProps } from '@/components/portal/value-props'
import { AppFooter } from '@/components/portal/app-footer'
import { AppBottomTab } from '@/components/portal/app-bottom-tab'

export default function HomePage() {
  const { scrollY } = useScroll()
  
  // 背景图片的视差效果
  const bgY = useTransform(scrollY, [0, 1000], [0, 200])
  const bgScale = useTransform(scrollY, [0, 500], [1, 1.1])
  const bgBlur = useTransform(scrollY, [0, 300], [0, 10])
  const bgOpacity = useTransform(scrollY, [0, 400], [1, 0.7])
  
  // 背景遮罩的效果
  const maskBlur = useTransform(scrollY, [0, 300], [0, 8])
  const maskOpacity = useTransform(scrollY, [0, 400], [0.6, 0.8])

  return (
    <div className="relative min-h-screen">
      {/* 背景图片 */}
      <motion.div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1920&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          y: bgY,
          scale: bgScale,
          filter: bgBlur,
          opacity: bgOpacity
        }}
      />
      {/* 背景遮罩 */}
      <motion.div 
        className="fixed inset-0 z-0 bg-white backdrop-blur-sm"
        style={{
          backgroundColor: maskOpacity,
          backdropFilter: maskBlur
        }}
      />
      
      <AppNavbar />
      <main className="relative z-10 pb-[calc(68px+env(safe-area-inset-bottom))]">
        <HeroSection />
        <ToolShowcase id="services" />
        <ValueProps />
        <AppFooter />
      </main>
      <AppBottomTab />
    </div>
  )
}
