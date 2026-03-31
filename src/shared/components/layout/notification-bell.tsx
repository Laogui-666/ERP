'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@shared/hooks/use-notifications'
import { formatDateTime } from '@shared/lib/utils'
import { NOTIFICATION_ICONS, getNotificationRoute } from '@shared/lib/notification-icons'

export function NotificationBell() {
  const router = useRouter()
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  const handleToggle = () => {
    if (!isOpen) {
      void fetchNotifications()
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/[0.04] active:scale-90 transition-all duration-200"
      >
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[var(--color-error)] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm shadow-[var(--color-error)]/30">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[300px] glass-modal p-0 z-50" style={{ animationDuration: '0.3s' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <span className="text-[13px] font-semibold text-[var(--color-text-primary)] tracking-wide">通知</span>
            {unreadCount > 0 && (
              <button
                onClick={() => { void markAllAsRead() }}
                className="text-[11px] text-[var(--color-info)] hover:text-[var(--color-primary-light)] transition-colors font-medium"
              >
                全部已读
              </button>
            )}
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <div className="text-[24px] mb-2 opacity-40">🔔</div>
                <p className="text-[13px] text-[var(--color-text-placeholder)]">暂无通知</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-white/[0.03] cursor-pointer transition-all duration-200 hover:bg-white/[0.03] active:bg-white/[0.05] ${
                    !n.isRead ? 'bg-[var(--color-info)]/[0.03]' : ''
                  }`}
                  onClick={() => {
                    void markAsRead(n.id)
                    const route = getNotificationRoute(n.orderId)
                    if (route) {
                      setIsOpen(false)
                      router.push(route)
                    }
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-[14px] shrink-0 mt-0.5">
                      {NOTIFICATION_ICONS[n.type] ?? '🔔'}
                    </span>
                    {!n.isRead && (
                      <span className="w-[6px] h-[6px] bg-[var(--color-info)] rounded-full mt-1.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[var(--color-text-primary)] font-medium leading-snug">{n.title}</p>
                      {n.content && (
                        <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5 line-clamp-2 leading-relaxed">{n.content}</p>
                      )}
                      <p className="text-[11px] text-[var(--color-text-placeholder)] mt-1">{formatDateTime(n.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
