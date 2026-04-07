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
  /** 上次写操作时间戳，用于防止轮询覆盖本地递减 */
  _lastMutationAt: number

  fetchNotifications: (unreadOnly?: boolean) => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  addNotification: (notification: NotificationItem) => void
}

/** 防闪回窗口：写操作后 5 秒内忽略轮询拉取的 count */
const MUTATION_COOLDOWN_MS = 5000

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  meta: null,
  isLoading: false,
  _lastMutationAt: 0,

  fetchNotifications: async (unreadOnly) => {
    set({ isLoading: true })
    try {
      const params = new URLSearchParams()
      if (unreadOnly) params.set('unreadOnly', 'true')

      const res = await apiFetch(`/api/notifications?${params.toString()}`)
      const json = await res.json()

      if (json.success) {
        const serverCount = json.meta?.unreadCount
        const { _lastMutationAt, unreadCount } = get()
        const withinCooldown = Date.now() - _lastMutationAt < MUTATION_COOLDOWN_MS

        set({
          notifications: json.data,
          meta: json.meta ?? null,
          // 冷却期内：只允许 count 减少（服务端已同步），不允许回弹增加
          unreadCount: withinCooldown
            ? Math.min(unreadCount, serverCount ?? unreadCount)
            : (serverCount ?? unreadCount),
        })
      }
    } finally {
      set({ isLoading: false })
    }
  },

  fetchUnreadCount: async () => {
    try {
      // 冷却期内跳过轮询拉取，防止覆盖本地递减
      const { _lastMutationAt } = get()
      if (Date.now() - _lastMutationAt < MUTATION_COOLDOWN_MS) return

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
        _lastMutationAt: Date.now(),
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
        _lastMutationAt: Date.now(),
      }))
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
      _lastMutationAt: Date.now(),
    }))
  },
}))
