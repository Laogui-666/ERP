'use client'

import { useEffect, useCallback } from 'react'
import { useNotificationStore } from '@shared/stores/notification-store'

export function useNotifications() {
  const {
    notifications,
    unreadCount,
    meta,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore()

  useEffect(() => {
    fetchUnreadCount()

    let interval: ReturnType<typeof setInterval> | null = null

    const startPolling = () => {
      if (!interval) {
        interval = setInterval(fetchUnreadCount, 30000)
      }
    }

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        fetchUnreadCount() // 立即刷新一次
        startPolling()
      }
    }

    // 页面可见时才轮询
    if (!document.hidden) {
      startPolling()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchUnreadCount])

  const refresh = useCallback(() => fetchNotifications(), [fetchNotifications])

  return {
    notifications,
    unreadCount,
    meta,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refresh,
  }
}
