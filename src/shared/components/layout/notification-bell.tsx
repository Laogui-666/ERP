'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@shared/hooks/use-notifications'
import { useAuth } from '@shared/hooks/use-auth'
import { formatDateTime } from '@shared/lib/utils'
import { NOTIFICATION_ICONS, getNotificationRoute } from '@shared/lib/notification-icons'

interface NotificationBellProps {
  /** 外部控制弹窗开关（用于底部 Tab 等场景） */
  externalOpen?: boolean
  /** 外部关闭回调 */
  onExternalClose?: () => void
  /** 隐藏默认铃铛按钮（仅渲染弹窗，由外部触发器控制） */
  hideTrigger?: boolean
}

export function NotificationBell({ externalOpen, onExternalClose, hideTrigger = false }: NotificationBellProps = {}) {
  const router = useRouter()
  const { user } = useAuth()
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotifications()
  const [internalOpen, setInternalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // 弹窗是否打开：外部控制优先，否则内部状态
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen
  const setIsOpen = useCallback((open: boolean) => {
    if (externalOpen !== undefined) {
      if (!open) onExternalClose?.()
    } else {
      setInternalOpen(open)
    }
  }, [externalOpen, onExternalClose])

  // 组件挂载时预加载通知数据（确保弹窗打开时有数据）
  useEffect(() => {
    void fetchNotifications()
  }, [fetchNotifications])

  const handleToggle = async () => {
    if (internalOpen) {
      setInternalOpen(false)
      return
    }
    setLoading(true)
    await fetchNotifications()
    setLoading(false)
    setInternalOpen(true)
  }

  // 打开时拉取通知
  useEffect(() => {
    if (isOpen) void fetchNotifications()
  }, [isOpen, fetchNotifications])

  // ESC 关闭
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, setIsOpen])

  // 打开时禁止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* 铃铛按钮（可隐藏） */}
      {!hideTrigger && (
        <button
          onClick={() => { void handleToggle() }}
          disabled={loading}
          className="relative p-2 rounded-lg text-liquid-mist hover:text-liquid-deep hover:bg-liquid-ocean/5 active:scale-90 transition-all duration-200 disabled:opacity-50"
        >
          {loading ? (
            <svg className="w-[18px] h-[18px] animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-liquid-ruby text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm shadow-liquid-ruby/30">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* 弹窗遮罩 + 卡片 */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          {/* 遮罩 */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }} />
          {/* 卡片 */}
          <div
            className="relative w-full max-w-md max-h-[80vh] flex flex-col rounded-2xl border border-liquid-ocean/10 shadow-2xl animate-scale-in overflow-hidden"
            style={{
              background: 'rgba(32, 38, 54, 0.96)',
              backdropFilter: 'blur(40px)',
              animationDuration: '300ms',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-liquid-ocean/10 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-white">通知</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-liquid-ruby text-white font-medium">{unreadCount}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={() => { void markAllAsRead() }}
                    className="text-[11px] text-liquid-ocean hover:text-liquid-oceanLight transition-colors font-medium"
                  >
                    全部已读
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-liquid-mist/60 hover:text-liquid-mist hover:bg-liquid-ocean/10 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 通知列表 */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="text-[36px] mb-3 opacity-40">🔔</div>
                  <p className="text-[14px] text-liquid-mist/60">暂无通知</p>
                  <p className="text-[12px] text-liquid-mist/60 mt-1 opacity-60">订单状态变更时会通知您</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-5 py-3.5 border-b border-liquid-ocean/5 cursor-pointer transition-all duration-200 hover:bg-liquid-ocean/5 active:bg-liquid-ocean/10 ${
                      !n.isRead ? 'bg-liquid-ocean/5' : ''
                    }`}
                    onClick={() => {
                      void markAsRead(n.id)
                      const route = getNotificationRoute(n.orderId, user?.role)
                      if (route) { setIsOpen(false); router.push(route) }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-[16px] shrink-0 mt-0.5">{NOTIFICATION_ICONS[n.type] ?? '🔔'}</span>
                      {!n.isRead && <span className="w-[6px] h-[6px] bg-liquid-ocean rounded-full mt-2 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[13px] text-white font-medium leading-snug truncate">{n.title}</p>
                          {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-liquid-ocean shrink-0" />}
                        </div>
                        {n.content && (
                          <p className="text-[12px] text-liquid-mist mt-0.5 line-clamp-2 leading-relaxed">{n.content}</p>
                        )}
                        <p className="text-[11px] text-liquid-mist/60 mt-1">{formatDateTime(n.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 底部：查看全部 */}
            {notifications.length > 0 && (
              <div className="shrink-0 px-5 py-3 border-t border-liquid-ocean/10">
                <button
                  onClick={() => {
                    setIsOpen(false)
                    // 根据角色跳转到对应的通知页面
                    const isCustomer = user?.role === 'CUSTOMER'
                    router.push(isCustomer ? '/customer/notifications' : '/admin/workspace')
                  }}
                  className="w-full py-2.5 rounded-xl text-[12px] text-liquid-ocean hover:text-liquid-oceanLight hover:bg-liquid-ocean/5 transition-all font-medium"
                >
                  查看全部通知 →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
