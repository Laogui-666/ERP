'use client'

import { useEffect, useRef, useState } from 'react'
import { GlassCard } from '@shared/ui/glass-card'
import { cn } from '@shared/lib/utils'

interface Destination {
  flag: string
  country: string
  type: string
  time: string
  price: string
}

const DESTINATIONS: Destination[] = [
  { flag: '🇯🇵', country: '日本', type: '单次旅游', time: '5-7工作日', price: '599' },
  { flag: '🇫🇷', country: '法国', type: '申根旅游', time: '10-15工作日', price: '899' },
  { flag: '🇺🇸', country: '美国', type: 'B1/B2', time: '面签后3-5日', price: '1299' },
  { flag: '🇦🇺', country: '澳洲', type: '旅游签', time: '15-20工作日', price: '999' },
  { flag: '🇬🇧', country: '英国', type: '旅游签', time: '15-20工作日', price: '1099' },
  { flag: '🇰🇷', country: '韩国', type: '单次旅游', time: '5-7工作日', price: '399' },
]

export function DestinationCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )

    if (scrollRef.current) observer.observe(scrollRef.current)
    return () => observer.disconnect()
  }, [])

  // 拖拽滚动（鼠标 + 触控）
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.pageX - (scrollRef.current?.offsetLeft ?? 0))
    setScrollLeft(scrollRef.current?.scrollLeft ?? 0)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    const x = e.pageX - (scrollRef.current?.offsetLeft ?? 0)
    const walk = (x - startX) * 1.5
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollLeft - walk
  }

  const handleMouseUp = () => setIsDragging(false)

  return (
    <div className="py-8">
      <h2
        className={cn(
          'mb-5 px-4 text-[18px] font-semibold text-[var(--color-text-primary)] transition-all duration-500',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
      >
        热门目的地
      </h2>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {DESTINATIONS.map((dest, i) => (
          <div
            key={dest.country}
            className={cn(
              'flex-shrink-0 transition-all duration-600',
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
            )}
            style={{
              transitionDelay: `${i * 100}ms`,
              transitionDuration: '600ms',
              scrollSnapAlign: 'start',
            }}
          >
            <GlassCard intensity="light" className="w-[160px] p-4">
              <span className="text-3xl">{dest.flag}</span>
              <p className="mt-2 text-[15px] font-semibold text-[var(--color-text-primary)]">
                {dest.country}
              </p>
              <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">
                {dest.type}
              </p>
              <p className="mt-2 text-[11px] text-[var(--color-text-placeholder)]">
                {dest.time}
              </p>
              <p className="mt-1 text-[14px] font-bold text-[var(--color-primary)]">
                ¥{dest.price}<span className="text-[11px] font-normal text-[var(--color-text-placeholder)]">起</span>
              </p>
            </GlassCard>
          </div>
        ))}
      </div>
    </div>
  )
}
