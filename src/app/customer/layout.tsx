'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useNotificationStore } from '@/stores/notification-store'
import { useChatStore } from '@/stores/chat-store'
import { useSocketClient, registerChatMessageHandler } from '@/hooks/use-socket-client'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/customer/orders', label: '订单', icon: '📋' },
  { href: '/customer/notifications', label: '消息', icon: '💬' },
  { href: '/customer/profile', label: '我的', icon: '👤' },
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

  // Socket.io 实时通知 → 即时刷新角标
  const { isConnected } = useSocketClient({
    onNotification: () => {
      fetchUnreadCount()
    },
  })

  // 监听聊天消息 → 刷新聊天未读（2s 节流）
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

  // 初始加载 + Socket 断连时的 fallback 轮询（30s）
  useEffect(() => {
    fetchUnreadCount()
    fetchRooms()
  }, [fetchUnreadCount, fetchRooms])

  useEffect(() => {
    if (isConnected) return // Socket 正常时不轮询
    const interval = setInterval(() => {
      fetchUnreadCount()
      fetchRooms()
    }, 30000)
    return () => clearInterval(interval)
  }, [isConnected, fetchUnreadCount, fetchRooms])

  return (
    <div className="min-h-screen">
      {/* 客户端顶部导航 */}
      <header className="glass-topbar sticky top-0 z-50 px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">
            沐海旅行
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--color-text-secondary)]">
              {user?.realName ?? ''}
            </span>
            <button
              onClick={() => {
                void logout()
              }}
              className="text-xs text-[var(--color-text-placeholder)] hover:text-[var(--color-error)] transition-colors"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      {/* 内容区域 */}
      <main className="mx-auto max-w-lg px-4 py-4 pb-20">{children}</main>

      {/* 底部Tab栏 */}
      <nav className="glass-topbar fixed bottom-0 left-0 right-0 z-50">
        <div className="mx-auto flex max-w-lg justify-around py-2">
          {TABS.map((tab) => {
            const isActive =
              pathname === tab.href || pathname.startsWith(tab.href + '/')
            const showBadge =
              tab.href === '/customer/notifications' && (unreadCount + chatUnread) > 0

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'relative flex flex-col items-center gap-1 px-4 py-1 transition-colors',
                  isActive
                    ? 'text-[var(--color-primary-light)]'
                    : 'text-[var(--color-text-placeholder)]',
                )}
              >
                <span className="relative">
                  <span className="text-lg">{tab.icon}</span>
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 rounded-full bg-[var(--color-error)] text-[10px] text-white flex items-center justify-center px-1">
                      {unreadCount + chatUnread > 9 ? '9+' : unreadCount + chatUnread}
                    </span>
                  )}
                </span>
                <span className="text-xs">{tab.label}</span>
                {isActive && (
                  <span className="absolute -bottom-0.5 w-4 h-0.5 rounded-full bg-[var(--color-primary)]" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
