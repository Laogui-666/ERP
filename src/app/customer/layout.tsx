'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@shared/hooks/use-auth'
import { useNotificationStore } from '@shared/stores/notification-store'
import { useChatStore } from '@erp/stores/chat-store'
import { useSocketClient, registerChatMessageHandler } from '@shared/hooks/use-socket-client'
import { NotificationBell } from '@shared/components/layout/notification-bell'
import { cn } from '@shared/lib/utils'

const TABS = [
  { href: '/portal', label: '首页', icon: '🏠' },
  { href: '/customer/orders', label: '订单', icon: '📋' },
  { href: '/customer/notifications', label: '通知', icon: '🔔', isNotification: true },
  { href: '/customer/chat', label: '消息', icon: '💬' },
  { href: '/portal/profile', label: '我的', icon: '👤' },
]

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const { unreadCount, fetchUnreadCount } = useNotificationStore()
  const { totalUnread: chatUnread, fetchRooms } = useChatStore()
  const [showNotificationPopup, setShowNotificationPopup] = useState(false)

  const { isConnected } = useSocketClient({
    onNotification: () => {
      fetchUnreadCount()
    },
  })

  const chatThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const unregister = registerChatMessageHandler('layout-chat', () => {
      if (chatThrottleRef.current) return
      chatThrottleRef.current = setTimeout(() => {
        chatThrottleRef.current = null
      }, 2000)
      fetchRooms()
    })
    return () => {
      unregister()
      if (chatThrottleRef.current) {
        clearTimeout(chatThrottleRef.current)
        chatThrottleRef.current = null
      }
    }
  }, [fetchRooms])

  useEffect(() => {
    fetchUnreadCount()
    fetchRooms()
  }, [fetchUnreadCount, fetchRooms])

  useEffect(() => {
    if (isConnected) return

    let interval: ReturnType<typeof setInterval> | null = null

    const poll = () => {
      if (!document.hidden) {
        fetchUnreadCount()
        fetchRooms()
      }
    }

    const startPolling = () => {
      if (!interval) interval = setInterval(poll, 30000)
    }

    const stopPolling = () => {
      if (interval) { clearInterval(interval); interval = null }
    }

    const onVisibility = () => {
      if (document.hidden) stopPolling()
      else { poll(); startPolling() }
    }

    if (!document.hidden) startPolling()
    document.addEventListener('visibilitychange', onVisibility)
    return () => { stopPolling(); document.removeEventListener('visibilitychange', onVisibility) }
  }, [isConnected, fetchUnreadCount, fetchRooms])

  return (
    <div className="min-h-screen pb-[68px]">
      {/* 顶部导航 */}
      <header className="glass-topbar sticky top-0 z-50 px-4 py-3.5">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <h1 className="text-[15px] font-bold text-[var(--color-text-primary)] tracking-tight">
            华夏签证
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-[var(--color-text-secondary)] font-medium">
              {user?.realName ?? ''}
            </span>
            <button
              onClick={() => { void logout() }}
              className="text-[11px] text-[var(--color-text-placeholder)] active:text-[var(--color-error)] transition-colors px-2 py-1 rounded-lg active:bg-[var(--color-error)]/10"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      {/* 内容区域 */}
      <main className="mx-auto max-w-lg px-4 py-4">
        <div className="anim-initial animate-fade-in-up">
          {children}
        </div>
      </main>

      {/* 底部Tab栏 */}
      <nav className="glass-topbar fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
        <div className="mx-auto flex max-w-lg justify-around py-2">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
            let showBadge = false
            let badgeCount = 0
            if (tab.isNotification && unreadCount > 0) {
              showBadge = true
              badgeCount = unreadCount
            } else if (tab.href === '/customer/chat' && chatUnread > 0) {
              showBadge = true
              badgeCount = chatUnread
            }

            // 通知 Tab：点击弹出卡片窗口，不跳转
            if (tab.isNotification) {
              return (
                <button
                  key={tab.href}
                  onClick={() => setShowNotificationPopup(true)}
                  className={cn(
                    'relative flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl transition-all duration-200 active:scale-90',
                    isActive
                      ? 'text-[var(--color-primary-light)]'
                      : 'text-[var(--color-text-placeholder)]',
                  )}
                >
                  <span className="relative">
                    <span className="text-[18px]">{tab.icon}</span>
                    {showBadge && (
                      <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 rounded-full bg-[var(--color-error)] text-[10px] text-white flex items-center justify-center px-1 font-medium shadow-sm shadow-[var(--color-error)]/30">
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </span>
                  <span className={cn(
                    'text-[11px] font-medium transition-colors',
                    isActive ? 'text-[var(--color-primary-light)]' : 'text-[var(--color-text-placeholder)]'
                  )}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <span className="absolute -bottom-0.5 w-5 h-[2px] rounded-full bg-[var(--color-primary)]" />
                  )}
                </button>
              )
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl transition-all duration-200 active:scale-90',
                  isActive
                    ? 'text-[var(--color-primary-light)]'
                    : 'text-[var(--color-text-placeholder)]',
                )}
              >
                <span className="relative">
                  <span className="text-[18px]">{tab.icon}</span>
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 rounded-full bg-[var(--color-error)] text-[10px] text-white flex items-center justify-center px-1 font-medium shadow-sm shadow-[var(--color-error)]/30">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </span>
                <span className={cn(
                  'text-[11px] font-medium transition-colors',
                  isActive ? 'text-[var(--color-primary-light)]' : 'text-[var(--color-text-placeholder)]'
                )}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute -bottom-0.5 w-5 h-[2px] rounded-full bg-[var(--color-primary)]" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* 通知弹窗（底部 Tab 触发） */}
      <NotificationBell
        hideTrigger
        externalOpen={showNotificationPopup}
        onExternalClose={() => setShowNotificationPopup(false)}
      />
    </div>
  )
}
