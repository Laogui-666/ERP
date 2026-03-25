'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api-client'
import { GlassCard } from '@/components/layout/glass-card'
import { useToast } from '@/components/ui/toast'
import { formatDateTime } from '@/lib/utils'
import { NOTIFICATION_ICONS, getNotificationRoute } from '@/lib/notification-icons'

interface Notification {
  id: string
  type: string
  title: string
  content: string | null
  isRead: boolean
  orderId: string | null
  createdAt: string
}

export default function CustomerNotificationsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const fetchNotifications = useCallback(async (targetPage: number, append: boolean) => {
    if (append) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
    }
    try {
      const res = await apiFetch(`/api/notifications?page=${targetPage}&pageSize=20`)
      const json = await res.json()
      if (json.success) {
        const items: Notification[] = json.data
        setNotifications((prev) => (append ? [...prev, ...items] : items))
        setUnreadCount(json.meta?.unreadCount ?? 0)
        setHasMore(items.length === 20)
        setPage(targetPage)
      }
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications(1, false)
  }, [fetchNotifications])

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchNotifications(page + 1, true)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    const res = await apiFetch(`/api/notifications/${id}`, { method: 'PATCH' })
    const json = await res.json()
    if (json.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  const handleMarkAllRead = async () => {
    const res = await apiFetch('/api/notifications/mark-all-read', { method: 'POST' })
    const json = await res.json()
    if (json.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast('success', '已全部标记为已读')
    }
  }

  const handleClick = async (notification: Notification) => {
    // 标记已读
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id)
    }
    // 跳转订单
    const route = getNotificationRoute(notification.orderId)
    if (route) {
      router.push(route)
    }
  }

  return (
    <div className="space-y-4 pb-20">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          消息
          {unreadCount > 0 && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[var(--color-error)] text-white">
              {unreadCount}
            </span>
          )}
        </h2>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-[var(--color-info)] hover:underline"
          >
            全部已读
          </button>
        )}
      </div>

      {/* 加载态 */}
      {isLoading ? (
        <GlassCard className="p-8 text-center">
          <div className="inline-block w-6 h-6 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">加载中...</p>
        </GlassCard>
      ) : notifications.length === 0 ? (
        /* 空态 */
        <GlassCard className="p-8 text-center animate-fade-in-up">
          <span className="text-3xl block mb-3">🔔</span>
          <p className="text-sm text-[var(--color-text-secondary)]">暂无消息</p>
          <p className="text-xs text-[var(--color-text-placeholder)] mt-1">
            订单状态变更时会通知您
          </p>
        </GlassCard>
      ) : (
        /* 通知列表 */
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <GlassCard
              key={n.id}
              className={`p-4 cursor-pointer transition-colors animate-fade-in-up ${
                !n.isRead ? 'border-l-2 border-l-[var(--color-primary)]' : ''
              }`}
              style={{ animationDelay: `${i * 30}ms` }}
              onClick={() => {
                void handleClick(n)
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0">
                  {NOTIFICATION_ICONS[n.type] ?? '🔔'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-sm truncate ${
                        !n.isRead
                          ? 'font-semibold text-[var(--color-text-primary)]'
                          : 'text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {n.title}
                    </span>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0" />
                    )}
                  </div>
                  {n.content && (
                    <p className="text-xs text-[var(--color-text-placeholder)] mt-1 line-clamp-2">
                      {n.content}
                    </p>
                  )}
                  <span className="text-[10px] text-[var(--color-text-placeholder)] mt-1 block">
                    {formatDateTime(n.createdAt)}
                  </span>
                </div>
              </div>
            </GlassCard>
          ))}

          {/* 加载更多 */}
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="w-full py-3 text-xs text-[var(--color-text-placeholder)] hover:text-[var(--color-text-secondary)] transition-colors disabled:opacity-50"
            >
              {isLoadingMore ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
                  加载中...
                </span>
              ) : (
                '加载更多'
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
