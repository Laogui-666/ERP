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
    // Poll every 30s
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
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
