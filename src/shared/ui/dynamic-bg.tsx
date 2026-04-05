'use client'

import { useEffect, useRef } from 'react'

/**
 * 动态背景 - 桌面端浮动光球 + 网格线 + 鼠标跟随光晕
 * 移动端自动隐藏（CSS media query）
 */
export function DynamicBackground() {
  const cursorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 仅桌面端启用鼠标跟随
    const mediaQuery = window.matchMedia('(min-width: 769px)')
    if (!mediaQuery.matches) return

    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`
        cursorRef.current.style.top = `${e.clientY}px`
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <>
      {/* 桌面端动态背景 */}
      <div className="dynamic-bg" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
        <div className="grid-lines" />
        <div ref={cursorRef} className="cursor-glow" />
      </div>

      {/* 移动端静态背景 */}
      <div className="static-bg" aria-hidden="true" />
    </>
  )
}
