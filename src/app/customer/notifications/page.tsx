'use client'

/**
 * 客户端通知页 — 液体玻璃设计版
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { apiFetch } from '@shared/lib/api-client'
import { useNotificationStore } from '@shared/stores/notification-store'
import { LiquidNotificationItem } from '@design-system/components/liquid-notification-item'
import { LiquidCard } from '@design-system/components/liquid-card'
import { LiquidButton } from '@design-system/components/liquid-button'
import { useToast } from '@shared/ui/toast'
import { formatDateTime } from '@shared/lib/utils'
import { NOTIFICATION_ICONS, getNotificationRoute } from '@shared/lib/notification-icons'
import { liquidSpringConfig } from '@design-system/theme/animations'

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
      // 同步更新全局 store
      useNotificationStore.setState((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }))
    }
  }

  const handleMarkAllRead = async () => {
    const res = await apiFetch('/api/notifications/mark-all-read', { method: 'POST' })
    const json = await res.json()
    if (json.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
      // 同步更新全局 store
      useNotificationStore.setState((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }))
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={liquidSpringConfig.gentle}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-lg font-semibold text-liquid-deep">
            站内通知
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-500 text-white"
              >
                {unreadCount}
              </motion.span>
            )}
          </h2>
          <p className="text-xs text-liquid-mist mt-1">订单状态变更时会通知您</p>
        </div>
        {unreadCount > 0 && (
          <LiquidButton
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
          >
            全部已读
          </LiquidButton>
        )}
      </motion.div>

      {/* 日期筛选 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...liquidSpringConfig.gentle, delay: 0.1 }}
        className="flex gap-2 overflow-x-auto scrollbar-none pb-1"
      >
        {DATE_FILTERS.map((f) => (
          <motion.button
            key={f.value}
            onClick={() => setDateFilter(f.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
              dateFilter === f.value
                ? 'bg-liquid-ocean text-white shadow-md shadow-liquid-ocean/20'
                : 'bg-white/50 text-liquid-mist hover:bg-white/70 border border-white/30'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {f.label}
          </motion.button>
        ))}
      </motion.div>

      {/* 通知列表 */}
      <LiquidCard padding="none" variant="liquid" className="overflow-hidden">
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin">
          {isLoading ? (
            <div className="p-8 text-center">
              <motion.div
                className="inline-block w-6 h-6 border-2 border-liquid-ocean/30 border-t-liquid-ocean rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <p className="mt-3 text-sm text-liquid-mist">加载中...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={liquidSpringConfig.bouncy}
              >
                <span className="text-3xl block mb-3">🔔</span>
                <p className="text-sm text-liquid-mist">暂无通知</p>
                <p className="text-xs text-liquid-silver mt-1">
                  订单状态变更时会通知您
                </p>
              </motion.div>
            </div>
          ) : (
            <div>
              {notifications.map((n, i) => (
                <LiquidNotificationItem
                  key={n.id}
                  icon={NOTIFICATION_ICONS[n.type] ?? '🔔'}
                  title={n.title}
                  content={n.content}
                  createdAt={formatDateTime(n.createdAt)}
                  isRead={n.isRead}
                  onClick={() => { void handleClick(n) }}
                  delay={i}
                />
              ))}

              {/* 加载更多 */}
              {hasMore && (
                <motion.button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="w-full py-3.5 text-xs text-liquid-silver hover:text-liquid-mist transition-colors disabled:opacity-50"
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                >
                  {isLoadingMore ? (
                    <span className="inline-flex items-center gap-2">
                      <motion.span
                        className="w-3 h-3 border-2 border-liquid-ocean/30 border-t-liquid-ocean rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      加载中...
                    </span>
                  ) : (
                    '加载更多'
                  )}
                </motion.button>
              )}
            </div>
          )}
        </div>
      </LiquidCard>
    </div>
  )
}
