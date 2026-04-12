'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@shared/hooks/use-auth'
import { motion, AnimatePresence } from 'framer-motion'
import { liquidSpringConfig } from '@design-system/theme/animations'

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

  const isScrolled = scrollY > 20

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...liquidSpringConfig.gentle, delay: 0.2 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'glass-navbar shadow-glass-soft' 
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 md:h-20 max-w-7xl items-center justify-between px-4 md:px-8 lg:px-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <motion.div 
            className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-liquid-ocean to-liquid-oceanLight flex items-center justify-center shadow-lg shadow-liquid-ocean/20"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={liquidSpringConfig.snappy}
          >
            <span className="text-xl md:text-2xl">🌏</span>
          </motion.div>
          <div className="hidden sm:block">
            <span className="text-lg md:text-xl font-bold tracking-tight text-liquid-deep">
              华夏签证
            </span>
            <p className="text-[10px] md:text-xs text-liquid-mist -mt-0.5">HX VISA</p>
          </div>
        </Link>

        {/* 桌面端导航链接 */}
        <nav className="hidden lg:flex items-center gap-8">
          {[
            { href: '/portal/tools', label: '工具中心' },
            { href: '/services', label: '签证服务' },
            { href: '/about', label: '关于我们' },
          ].map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...liquidSpringConfig.gentle, delay: 0.3 + index * 0.1 }}
            >
              <Link 
                href={item.href}
                className="text-sm font-medium text-glass-text-primary/80 hover:text-glass-primary transition-colors relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-glass-primary rounded-full transition-all duration-300 group-hover:w-full" />
              </Link>
            </motion.div>
          ))}
        </nav>

        {/* 搜索栏（桌面端展开） */}
        <div className="hidden md:block flex-1 max-w-md mx-6 lg:mx-8">
          <motion.div 
            className="relative group"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...liquidSpringConfig.gentle, delay: 0.4 }}
          >
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-glass-text-muted transition-colors group-focus-within:text-glass-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder="搜索国家、签证类型..."
                className="w-full h-11 md:h-12 rounded-glass-sm border border-glass-border-light bg-glass-bg-card backdrop-blur-glass py-2 pl-11 pr-4 text-sm text-glass-text-primary placeholder:text-glass-text-muted/70 transition-all duration-300 focus:border-glass-primary-light focus:shadow-glass-glow focus:outline-none glass-input-hover"
              />
          </motion.div>
        </div>

        {/* 右侧 */}
        <div className="flex items-center gap-2 md:gap-3">
          {user ? (
            <>
              {/* 通知铃铛 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...liquidSpringConfig.gentle, delay: 0.5 }}
              >
                <Link 
                  href="/portal/notifications" 
                  className="relative flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-glass-sm glass-button text-glass-text-muted hover:text-glass-primary transition-all duration-300 glass-button-hover"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  <span className="absolute top-2 right-2 w-2 h-2 bg-glass-danger rounded-full" />
                </Link>
              </motion.div>

              {/* 头像下拉 */}
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...liquidSpringConfig.gentle, delay: 0.55 }}
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-glass-sm glass-button bg-glass-primary/10 border border-glass-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-glass-medium glass-button-hover"
                >
                  <span className="text-sm font-semibold text-glass-text-primary">
                    {user.realName?.[0] ?? '👤'}
                  </span>
                </motion.button>

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={liquidSpringConfig.snappy}
                      className="absolute right-0 top-12 w-52 p-2 rounded-glass-lg glass-modal shadow-glass-strong"
                    >
                      <div className="px-3 py-2.5 text-sm text-glass-text-muted border-b border-glass-border-light mb-1">
                        <p className="font-semibold text-glass-text-primary">{user.realName}</p>
                        <p className="text-xs mt-0.5">{user.email}</p>
                      </div>
                      <Link href="/portal/profile" onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 rounded-glass-sm px-3 py-2.5 text-sm text-glass-text-primary hover:bg-glass-bg-card transition-colors glass-hover">
                        <svg className="w-4 h-4 text-glass-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        个人中心
                      </Link>
                      <Link href="/portal/orders" onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 rounded-glass-sm px-3 py-2.5 text-sm text-glass-text-primary hover:bg-glass-bg-card transition-colors glass-hover">
                        <svg className="w-4 h-4 text-glass-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        我的订单
                      </Link>
                      {user.role !== 'CUSTOMER' && (
                        <Link href="/admin/dashboard" onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-3 rounded-glass-sm px-3 py-2.5 text-sm text-glass-text-primary hover:bg-glass-bg-card transition-colors glass-hover">
                          <svg className="w-4 h-4 text-glass-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                          管理后台
                        </Link>
                      )}
                      <div className="border-t border-glass-border-light mt-1 pt-1">
                        <button onClick={() => { setShowDropdown(false); void logout() }}
                          className="w-full flex items-center gap-3 rounded-glass-sm px-3 py-2.5 text-sm text-glass-danger hover:bg-glass-danger/10 transition-colors glass-hover">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          退出登录
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...liquidSpringConfig.gentle, delay: 0.5 }}
              >
                <Link 
                  href="/login" 
                  className="px-4 md:px-6 py-2 md:py-2.5 text-sm font-semibold text-glass-text-primary glass-button glass-button-primary hover:shadow-glass-medium hover:scale-105 transition-all duration-300"
                >
                  登录
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...liquidSpringConfig.gentle, delay: 0.55 }}
              >
                <Link 
                  href="/register" 
                  className="px-4 md:px-6 py-2 md:py-2.5 text-sm font-semibold text-glass-text-primary glass-button glass-button-primary hover:shadow-glass-medium hover:scale-105 transition-all duration-300"
                >
                  注册
                </Link>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </motion.header>
  )
}
