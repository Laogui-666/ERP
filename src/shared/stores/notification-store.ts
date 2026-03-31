import { create } from 'zustand'
import type { ApiMeta } from '@shared/types/api'
import { apiFetch } from '@shared/lib/api-client'

interface NotificationItem {
  id: string
  type: string
  title: string
  content: string | null
  isRead: boolean
  orderId: string | null
  createdAt: string
}

interface NotificationState {
  notifications: NotificationItem[]
  unreadCount: number
  meta: ApiMeta | null
  isLoading: boolean

  fetchNotifications: (unreadOnly?: boolean) => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  addNotification: (notification: NotificationItem) => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  meta: null,
  isLoading: false,

  fetchNotifications: async (unreadOnly) => {
    set({ isLoading: true })
    try {
      const params = new URLSearchParams()
      if (unreadOnly) params.set('unreadOnly', 'true')

      const res = await apiFetch(`/api/notifications?${params.toString()}`)
      const json = await res.json()

      if (json.success) {
        set({
          notifications: json.data,
          meta: json.meta ?? null,
          unreadCount: json.meta?.unreadCount ?? get().unreadCount,
        })
      }
    } finally {
      set({ isLoading: false })
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await apiFetch('/api/notifications?unreadOnly=true&pageSize=1')
      const json = await res.json()
      if (json.success) {
        set({ unreadCount: json.meta?.unreadCount ?? 0 })
      }
    } catch {
      // silent
    }
  },

  markAsRead: async (id) => {
    const res = await apiFetch(`/api/notifications/${id}`, { method: 'PATCH' })
    const json = await res.json()
    if (json.success) {
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }))
    }
  },

  markAllAsRead: async () => {
    const res = await apiFetch('/api/notifications/mark-all-read', { method: 'POST' })
    const json = await res.json()
    if (json.success) {
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }))
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }))
  },
}))
