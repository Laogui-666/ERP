'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@shared/ui/button'

const TAGS = ['🇯🇵 日本', '🇰🇷 韩国', '🇪🇺 申根', '🇺🇸 美国', '🇹🇭 泰国', '🌍 更多']
const TITLE_WORDS = '想去哪，华夏签证帮你搞定'.split('')

export function HeroSection() {
  const [scrollY, setScrollY] = useState(0)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const ctaRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handleMouse, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  // 磁性按钮
  const handleCtaMove = (e: React.MouseEvent) => {
    if (!ctaRef.current) return
    const rect = ctaRef.current.getBoundingClientRect()
    const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.12
    const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.12
    ctaRef.current.style.transform = `translate(${dx}px, ${dy}px)`
  }
  const handleCtaLeave = () => {
    if (ctaRef.current) ctaRef.current.style.transform = ''
  }

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-gradient-to-b from-blue-50 to-white">
      {/* Layer 1: 渐变网格（2个现代色球体缓慢漂移） */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-100 to-transparent animate-gradient-drift-1 opacity-60 md:opacity-100 md:w-[600px] md:h-[600px]" />
        <div className="absolute top-1/3 -right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-purple-100 to-transparent animate-gradient-drift-2 opacity-50 md:opacity-100 md:w-[500px] md:h-[500px]" />
      </div>

      {/* Layer 3: 鼠标跟随聚光灯（仅桌面端） */}
      <div className="hidden md:block absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(59, 130, 246, 0.05), transparent 40%)` }} />

      {/* Layer 4: 内容层 */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 w-full" style={{ transform: `translateY(${scrollY * 0.2}px)` }}>
        <div className="max-w-2xl">
          {/* 标题 — 逐词渐显 + 扫光 */}
          <h1 className="text-[28px] md:text-[40px] font-bold tracking-tight leading-tight text-gray-900">
            {TITLE_WORDS.map((char, i) => (
              <span key={i} className={`inline-block transition-all duration-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${200 + i * 70}ms` }}>
                {char}
              </span>
            ))}
          </h1>

          {/* 副标题 */}
          <p className={`mt-4 text-[14px] md:text-[16px] text-gray-600 leading-relaxed max-w-md transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: `${200 + TITLE_WORDS.length * 70 + 200}ms` }}>
            专业签证办理 · 50+ 国家覆盖 · AI 智能工具 · 99.2% 出签率
          </p>

          {/* 搜索框 */}
          <div className={`mt-8 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
            style={{ transitionDelay: `${200 + TITLE_WORDS.length * 70 + 300}ms` }}>
            {/* 桌面端完整搜索框 */}
            <div className="hidden md:block">
              <div className="relative max-w-lg">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  type="text"
                  placeholder="输入国家或签证类型..."
                  className="w-full h-14 rounded-xl border border-gray-200 bg-white pl-12 pr-4 text-[14px] text-gray-900 placeholder:text-gray-400 transition-all focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none shadow-sm"
                />
              </div>
            </div>
            {/* 移动端收缩搜索图标 */}
            <div className="md:hidden">
              {searchOpen ? (
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <input
                    autoFocus
                    type="text"
                    placeholder="搜索国家、签证类型..."
                    className="w-full h-12 rounded-xl border border-gray-200 bg-white pl-12 pr-4 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none shadow-sm"
                  />
                </div>
              ) : (
                <button onClick={() => setSearchOpen(true)}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* 快捷标签 */}
          <div className={`mt-4 flex flex-wrap gap-2 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: `${200 + TITLE_WORDS.length * 70 + 400}ms` }}>
            {TAGS.map((tag, i) => (
              <span key={tag}
                className="cursor-pointer rounded-full bg-white border border-gray-200 px-3.5 py-1.5 text-[12px] text-gray-600 transition-all hover:bg-gray-50 hover:border-primary/20 active:scale-95 shadow-sm"
                style={{ transitionDelay: `${450 + i * 50}ms` }}>
                {tag}
              </span>
            ))}
          </div>

          {/* CTA 按钮 */}
          <div className={`mt-8 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
            style={{ transitionDelay: `${200 + TITLE_WORDS.length * 70 + 600}ms` }}>
            <Link href="/register">
              <Button
                ref={ctaRef as any}
                onMouseMove={handleCtaMove}
                onMouseLeave={handleCtaLeave}
                size="lg"
                className="rounded-xl px-8 py-3.5 text-[15px] font-semibold transition-shadow hover:shadow-lg active:scale-[0.97]"
              >
                开始探索
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Layer 5: 底部渐隐遮罩 */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  )
}
