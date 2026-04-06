'use client'

/**
 * 客户端通知页 — 卡片窗口布局 + 日期筛选
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@shared/lib/api-client'
import { GlassCard } from '@shared/ui/glass-card'
import { useToast } from '@shared/ui/toast'
import { formatDateTime } from '@shared/lib/utils'
import { NOTIFICATION_ICONS, getNotificationRoute } from '@shared/lib/notification-icons'

interface Notification {
  id: string
  type: string
  title: string
  content: string | null
  isRead: boolean
  orderId: string | null
  createdAt: string
}

// 日期范围选项
const DATE_FILTERS = [
  { label: '今天', value: 'today' },
  { label: '近3天', value: '3days' },
  { label: '近7天', value: '7days' },
  { label: '近30天', value: '30days' },
  { label: '全部', value: 'all' },
] as const

type DateFilter = typeof DATE_FILTERS[number]['value']

function getDateRange(filter: DateFilter): { from?: string } {
  const now = new Date()
  switch (filter) {
    case 'today': {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return { from: d.toISOString() }
    }
    case '3days': {
      const d = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      return { from: d.toISOString() }
    }
    case '7days': {
      const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return { from: d.toISOString() }
    }
    case '30days': {
      const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return { from: d.toISOString() }
    }
    default:
      return {}
  }
}

export default function CustomerNotificationsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<DateFilter>('7days')
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
      const { from } = getDateRange(dateFilter)
      let url = `/api/notifications?page=${targetPage}&pageSize=20`
      if (from) url += `&from=${encodeURIComponent(from)}`
      const res = await apiFetch(url)
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
  }, [dateFilter])

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
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id)
    }
    const route = getNotificationRoute(notification.orderId, 'CUSTOMER')
    if (route) {
      router.push(route)
    }
  }

  return (
    <div className="space-y-4 pb-20">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          站内通知
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

      {/* 日期筛选 */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {DATE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setDateFilter(f.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
              dateFilter === f.value
                ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20'
                : 'bg-white/[0.06] text-[var(--color-text-secondary)] hover:bg-white/[0.10]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 通知卡片容器 */}
      <GlassCard className="overflow-hidden">
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block w-6 h-6 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
              <p className="mt-3 text-sm text-[var(--color-text-secondary)]">加载中...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center animate-fade-in-up">
              <span className="text-3xl block mb-3">🔔</span>
              <p className="text-sm text-[var(--color-text-secondary)]">暂无通知</p>
              <p className="text-xs text-[var(--color-text-placeholder)] mt-1">
                订单状态变更时会通知您
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {notifications.map((n, i) => (
                <div
                  key={n.id}
                  className={`px-4 py-3.5 cursor-pointer transition-colors hover:bg-white/[0.03] active:bg-white/[0.05] animate-fade-in-up ${
                    !n.isRead ? 'bg-[var(--color-primary)]/[0.04]' : ''
                  }`}
                  style={{ animationDelay: `${i * 20}ms` }}
                  onClick={() => { void handleClick(n) }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-base shrink-0 mt-0.5">
                      {NOTIFICATION_ICONS[n.type] ?? '🔔'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[13px] truncate ${
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
                        <p className="text-xs text-[var(--color-text-placeholder)] mt-0.5 line-clamp-2 leading-relaxed">
                          {n.content}
                        </p>
                      )}
                      <span className="text-[10px] text-[var(--color-text-placeholder)] mt-1 block">
                        {formatDateTime(n.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* 加载更多 */}
              {hasMore && (
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="w-full py-3.5 text-xs text-[var(--color-text-placeholder)] hover:text-[var(--color-text-secondary)] transition-colors disabled:opacity-50"
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
      </GlassCard>
    </div>
  )
}
