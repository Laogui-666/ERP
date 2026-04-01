'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@shared/hooks/use-auth'

export function PortalTopbar() {
  const { user } = useAuth()
  const [scrollY, setScrollY] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 滚动监听 → 透明度渐变 0.72 → 0.92
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const opacity = Math.min(0.92, 0.72 + scrollY / 500)

  return (
    <header
      className="glass-topbar fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{ backgroundColor: `rgba(22, 27, 41, ${opacity})` }}
    >
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        {/* 品牌 */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🌊</span>
          <span className="text-[15px] font-semibold tracking-tight text-[var(--color-text-primary)]">
            沐海旅行
          </span>
        </Link>

        {/* 右侧：登录 / 头像 */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)]/25 to-[var(--color-accent)]/15 border border-white/10 transition-transform duration-200 hover:scale-105"
              >
                <span className="text-sm">
                  {user.role === 'CUSTOMER' ? '🙋' : '👤'}
                </span>
              </button>

              {/* 下拉菜单 */}
              {showDropdown && (
                <div className="glass-modal absolute right-0 top-10 w-48 p-2 animate-scale-in">
                  <div className="px-3 py-2 text-[12px] text-[var(--color-text-secondary)] border-b border-white/[0.06] mb-1">
                    {user.realName}
                  </div>
                  <Link
                    href="/portal/profile"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[var(--color-text-primary)] hover:bg-white/[0.06] transition-colors"
                  >
                    🙋 个人中心
                  </Link>
                  {user.role !== 'CUSTOMER' && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[var(--color-text-primary)] hover:bg-white/[0.06] transition-colors"
                    >
                      🖥️ 管理后台
                    </Link>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="glass-btn-primary px-4 py-1.5 text-[13px] font-medium"
            >
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
