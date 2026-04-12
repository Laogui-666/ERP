'use client'

import { useState, useEffect } from 'react'
import { AppNavbar } from '@/components/portal/app-navbar'
import { HeroSection } from '@/components/portal/hero-section'
import { ToolShowcase } from '@/components/portal/tool-showcase'
import { ValueProps } from '@/components/portal/value-props'
import { AppFooter } from '@/components/portal/app-footer'
import { AppBottomTab } from '@/components/portal/app-bottom-tab'

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="relative min-h-screen">
      {/* 背景图片 */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(/background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: `translateY(${scrollY * 0.5}px)`,
          opacity: 1
        }}
      />
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 z-0 bg-white/30 backdrop-blur-sm"
        style={{
          backdropFilter: `blur(${Math.min(scrollY / 100, 4)}px)`,
          backgroundColor: `rgba(255, 255, 255, ${Math.min(0.3 + scrollY / 1000, 0.5)})`
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
