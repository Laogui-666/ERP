'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@shared/stores/auth-store'
import type { UserProfile } from '@shared/types/user'

/**
 * 盼达旅行 - 公共导航栏
 * 包含账号信息面板和ERP入口
 */
export function PublicNavbar() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, logout } = useAuthStore()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // 滚动监听
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 点击外部关闭用户菜单
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    await logout()
    setUserMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  // 根据角色获取ERP入口
  const getErpEntry = (user: UserProfile) => {
    const entries = {
      SUPERADMIN: { href: '/admin/dashboard', label: '管理后台', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
      ADMIN: { href: '/admin/dashboard', label: '管理后台', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
      OPERATOR: { href: '/admin/orders', label: '工作台', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
      FINANCE: { href: '/admin/analytics', label: '财务统计', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
      CUSTOMER: { href: '/customer/orders', label: '客户门户', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    }
    return entries[user.role as keyof typeof entries] || entries.CUSTOMER
  }

  const navLinks = [
    { href: '/services', label: '签证服务' },
    { href: '/translation', label: '一键翻译' },
    { href: '/assessment', label: '签证评估' },
    { href: '/itinerary', label: '行程规划' },
  ]

  const roleLabels: Record<string, string> = {
    SUPERADMIN: '超级管理员',
    ADMIN: '管理员',
    OPERATOR: '操作员',
    FINANCE: '财务',
    CUSTOMER: '客户',
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[var(--color-bg-primary)]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/10'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary)]/30 to-[var(--color-accent)]/20 backdrop-blur-sm border border-white/[0.1] shadow-lg shadow-[var(--color-primary)]/10 transition-transform duration-300 group-hover:scale-105">
              <svg className="w-5 h-5 text-[var(--color-primary-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-[17px] font-bold tracking-tight text-[var(--color-text-primary)]">
              盼达旅行
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-[14px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors rounded-lg hover:bg-white/[0.04]"
              >
{link.label}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-20 h-8 rounded-lg bg-white/[0.04] animate-pulse" />
                <div className="w-24 h-8 rounded-lg bg-white/[0.04] animate-pulse" />
              </div>
            ) : isAuthenticated && user ? (
              /* 已登录：显示用户菜单 */
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)]/30 to-[var(--color-accent)]/20 text-[13px] font-medium">
                    {user.realName?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-[13px] font-medium text-[var(--color-text-primary)]">
                      {user.realName || user.username}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-placeholder)]">
                      {roleLabels[user.role] || user.role}
                    </div>
                  </div>
                  <svg className={`w-4 h-4 text-[var(--color-text-placeholder)] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* 用户下拉菜单 */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 animate-scale-in">
                    <div className="glass-modal p-3 space-y-1">
                      {/* 用户信息 */}
                      <div className="px-3 py-2 border-b border-white/[0.06] mb-2">
                        <div className="text-[13px] font-medium text-[var(--color-text-primary)]">
                          {user.realName || user.username}
                        </div>
                        <div className="text-[11px] text-[var(--color-text-secondary)]">
                          {user.email || user.phone || user.username}
                        </div>
                        <div className="mt-1 inline-flex px-2 py-0.5 text-[10px] font-medium bg-[var(--color-primary)]/15 text-[var(--color-primary-light)] rounded">
                          {roleLabels[user.role] || user.role}
                        </div>
                      </div>

                      {/* ERP入口 - 根据角色显示 */}
                      <Link
                        href={getErpEntry(user).href}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-accent)]/10 hover:from-[var(--color-primary)]/30 hover:to-[var(--color-accent)]/20 border border-[var(--color-primary)]/20 transition-all"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]/20">
                          <svg className="w-4.5 h-4.5 text-[var(--color-primary-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={getErpEntry(user).icon} />
                          </svg>
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                            进入{getErpEntry(user).label}
                          </div>
                          <div className="text-[11px] text-[var(--color-primary)]">
                            点击访问 ERP 系统
                          </div>
                        </div>
                        <svg className="w-4 h-4 ml-auto text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>

                      {/* 菜单分隔线 */}
                      <div className="border-t border-white/[0.06] my-2" />

                      {/* 个人中心 */}
                      <Link
                        href={user.role === 'CUSTOMER' ? '/customer/profile' : '/admin/profile'}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/[0.04] rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        个人中心
                      </Link>

                      {/* 我的订单（客户） */}
                      {user.role === 'CUSTOMER' && (
                        <Link
                          href="/customer/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/[0.04] rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          我的订单
                        </Link>
                      )}

                      {/* 退出登录 */}
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        退出登录
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* 未登录 */
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-[13px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="glass-btn-primary px-4 py-2 text-[13px] font-semibold"
                >
                  免费注册
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden ml-2 p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/[0.06] animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 text-[14px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border-b border-white/[0.04]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  )
}
