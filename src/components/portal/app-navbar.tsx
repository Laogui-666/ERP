'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@shared/hooks/use-auth'

export function AppNavbar() {
  const { user, logout } = useAuth()
  const [scrollY, setScrollY] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
  const isScrolled = scrollY > 20

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-white/[0.04]"
      style={{
        backgroundColor: `rgba(22, 27, 41, ${opacity})`,
        backdropFilter: isScrolled ? 'blur(20px)' : 'none',
        boxShadow: isScrolled ? '0 2px 16px rgba(0,0,0,0.08)' : 'none',
      }}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🌏</span>
          <span className="text-[15px] font-semibold tracking-tight text-[var(--color-text-primary)]">
            华夏签证
          </span>
        </Link>

        {/* 搜索栏（桌面端展开） */}
        <div className="hidden md:block flex-1 max-w-sm mx-8">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-placeholder)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="搜索国家、签证类型..."
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] py-2 pl-10 pr-4 text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] backdrop-blur-sm transition-all focus:border-[var(--color-primary)]/40 focus:shadow-[0_0_0_3px_rgba(124,141,166,0.1)] focus:outline-none"
            />
          </div>
        </div>

        {/* 右侧 */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* 通知铃铛 */}
              <Link href="/portal/profile" className="relative flex h-9 w-9 items-center justify-center rounded-xl hover:bg-white/[0.06] transition-colors">
                <svg className="w-[18px] h-[18px] text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </Link>

              {/* 头像下拉 */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)]/25 to-[var(--color-accent)]/15 border border-white/10 transition-transform duration-200 hover:scale-105"
                >
                  <span className="text-[12px] font-medium text-[var(--color-text-primary)]">
                    {user.realName?.[0] ?? '👤'}
                  </span>
                </button>

                {showDropdown && (
                  <div className="glass-modal absolute right-0 top-10 w-48 p-2 animate-scale-in">
                    <div className="px-3 py-2 text-[12px] text-[var(--color-text-secondary)] border-b border-white/[0.06] mb-1">
                      {user.realName}
                    </div>
                    <Link href="/portal/profile" onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[var(--color-text-primary)] hover:bg-white/[0.06] transition-colors">
                      个人中心
                    </Link>
                    {user.role !== 'CUSTOMER' && (
                      <Link href="/admin/dashboard" onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[var(--color-text-primary)] hover:bg-white/[0.06] transition-colors">
                        管理后台
                      </Link>
                    )}
                    <button onClick={() => { setShowDropdown(false); void logout() }}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors">
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="glass-btn-secondary px-4 py-1.5 text-[13px] font-medium">
                登录
              </Link>
              <Link href="/register" className="glass-btn-primary px-4 py-1.5 text-[13px] font-medium">
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
