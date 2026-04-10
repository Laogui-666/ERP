'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@shared/hooks/use-auth'
import { GlassCard } from '@shared/ui/glass-card'
import { useToast } from '@shared/ui/toast'
import { apiFetch } from '@shared/lib/api-client'
import { cn } from '@shared/lib/utils'
import { getNotificationRoute } from '@shared/lib/notification-icons'

interface NotificationItem {
  id: string
  type: string
  title: string
  content: string
  isRead: boolean
  createdAt: string
  orderId?: string | null
}

const NOTIFICATION_ICONS: Record<string, { emoji: string; color: string }> = {
  ORDER_NEW: { emoji: '📬', color: 'text-glass-primary' },
  ORDER_CREATED: { emoji: '📋', color: 'text-glass-primary' },
  STATUS_CHANGE: { emoji: '🔄', color: 'text-glass-warning' },
  DOC_REVIEWED: { emoji: '📄', color: 'text-glass-primary' },
  MATERIAL_UPLOADED: { emoji: '📎', color: 'text-glass-accent' },
  MATERIAL_FEEDBACK: { emoji: '💬', color: 'text-glass-primary' },
  APPOINTMENT_REMIND: { emoji: '⏰', color: 'text-glass-warning' },
  DOCS_SUBMITTED: { emoji: '✅', color: 'text-glass-accent' },
  CHAT_MESSAGE: { emoji: '💬', color: 'text-glass-primary' },
  SYSTEM: { emoji: '🔔', color: 'text-glass-muted' },
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchNotifications = useCallback(async (pageNum: number, append = false) => {
    try {
      const res = await apiFetch(`/api/notifications?page=${pageNum}&pageSize=20`)
      const json = await res.json()
      if (json.success) {
        const items: NotificationItem[] = json.data ?? []
        setNotifications((prev) => (append ? [...prev, ...items] : items))
        setUnreadCount(json.meta?.unreadCount ?? 0)
        setHasMore(items.length === 20)
      }
    } catch {
      // 静默
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    if (user) fetchNotifications(1)
  }, [user, fetchNotifications])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    setLoadingMore(true)
    fetchNotifications(nextPage, true)
  }

  const handleMarkAllRead = async () => {
    try {
      const res = await apiFetch('/api/notifications/mark-all-read', { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        setUnreadCount(0)
        toast('success', '已全部标记为已读')
      }
    } catch {
      toast('error', '操作失败')
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-glass-muted">加载中...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* 顶栏 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/portal/profile"
            className="glass-button-hover flex h-8 w-8 items-center justify-center rounded-xl text-glass-muted hover:text-glass-primary"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-[18px] font-semibold text-glass-primary">通知中心</h1>
          {unreadCount > 0 && (
            <span className="flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-glass-danger px-1.5 text-[11px] font-medium text-white">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="glass-button-hover rounded-xl px-3 py-1.5 text-[12px] text-glass-primary"
          >
            全部已读
          </button>
        )}
      </div>

      {/* 通知列表 */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <GlassCard key={i} intensity="light" className="flex items-start gap-3 p-4">
              <div className="skeleton h-10 w-10 rounded-xl" />
              <div className="flex-1">
                <div className="skeleton mb-2 h-3 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </GlassCard>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <span className="text-4xl">🔔</span>
          <p className="text-[14px] font-medium text-glass-muted">暂无通知</p>
          <p className="text-[12px] text-glass-muted/60">有新消息时会在这里提醒你</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const iconInfo = NOTIFICATION_ICONS[notif.type] ?? NOTIFICATION_ICONS.SYSTEM
            return (
              <div
                key={notif.id}
                onClick={() => {
                  const route = getNotificationRoute(notif.orderId ?? null, user?.role)
                  if (route) {
                    router.push(route)
                  }
                }}
                className={notif.orderId ? 'cursor-pointer' : ''}
              >
                <GlassCard
                  intensity="light"
                  hover
                  className={cn(
                    'flex items-start gap-3 p-4 transition-all',
                    !notif.isRead && 'border-l-2 border-l-glass-primary/50 bg-glass-primary/4'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
                      !notif.isRead ? 'bg-glass-primary/15' : 'bg-glass-primary/5'
                    )}
                  >
                    <span className={cn('text-base', iconInfo.color)}>{iconInfo.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-[14px]',
                        !notif.isRead
                          ? 'font-medium text-glass-primary'
                          : 'text-glass-muted'
                      )}
                    >
                      {notif.title}
                    </p>
                    <p className="mt-1 text-[12px] text-glass-muted/60 line-clamp-2">
                      {notif.content}
                    </p>
                    <p className="mt-1 text-[11px] text-glass-muted/60">
                      {formatRelativeTime(notif.createdAt)}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-glass-primary" />
                  )}
                </GlassCard>
              </div>
            )
          })}

          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full py-3 text-center text-[13px] text-glass-primary transition-colors hover:text-glass-primary/80 disabled:opacity-50"
            >
              {loadingMore ? '加载中...' : '加载更多'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
