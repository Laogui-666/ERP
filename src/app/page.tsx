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
      {/* 背景图片 - 高度3500px，固定显示 */}
      <div 
        className="fixed top-0 left-0 right-0 z-[-1]"
        style={{
          height: '3500px',
          backgroundImage: 'url(/背景图3.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
          opacity: 1
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
