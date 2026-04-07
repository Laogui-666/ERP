'use client'

import { useState, useEffect, useRef } from 'react'
import { Sidebar } from '@erp/components/layout/sidebar'
import { Topbar } from '@erp/components/layout/topbar'
import { useNotificationStore } from '@shared/stores/notification-store'
import { useChatStore } from '@erp/stores/chat-store'
import { useSocketClient, registerChatMessageHandler } from '@shared/hooks/use-socket-client'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { fetchUnreadCount } = useNotificationStore()
  const { fetchRooms } = useChatStore()

  // Socket 连接 + 通知实时刷新
  const { isConnected } = useSocketClient({
    onNotification: () => {
      fetchUnreadCount()
    },
  })

  // 聊天消息实时刷新（防抖 2s）
  const chatThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const unregister = registerChatMessageHandler('admin-layout-chat', () => {
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

  // 初始化 + 轮询兜底
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
    const startPolling = () => { if (!interval) interval = setInterval(poll, 30000) }
    const stopPolling = () => { if (interval) { clearInterval(interval); interval = null } }
    const onVisibility = () => {
      if (document.hidden) stopPolling()
      else { poll(); startPolling() }
    }
    if (!document.hidden) startPolling()
    document.addEventListener('visibilitychange', onVisibility)
    return () => { stopPolling(); document.removeEventListener('visibilitychange', onVisibility) }
  }, [isConnected, fetchUnreadCount, fetchRooms])

  return (
    <div className="min-h-screen bg-background">
      {/* 桌面端侧边栏 */}
      <Sidebar />

      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 移动端侧边栏抽屉 */}
      <div className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar />
      </div>

      {/* 移动端顶栏 */}
      <header className="fixed top-0 left-0 right-0 h-14 flex items-center px-4 z-30 md:hidden bg-background/80 backdrop-blur-md border-b border-border">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent active:scale-90 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="ml-3 text-sm font-bold text-foreground tracking-tight">Visa ERP</span>
      </header>

      {/* 桌面端顶栏 */}
      <div className="hidden md:block">
        <Topbar />
      </div>

      {/* 主内容区 */}
      <main className="pt-14 md:ml-64 md:pt-16 min-h-screen">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
