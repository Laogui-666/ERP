import { create } from 'zustand'
import { apiFetch } from '@shared/lib/api-client'
import type { ChatRoomSummary, ChatMessageItem, SendMessagePayload } from '@erp/types/chat'

interface ChatState {
  // 会话列表
  rooms: ChatRoomSummary[]
  totalUnread: number

  // 消息缓存（按 orderId 分组）
  messages: Record<string, ChatMessageItem[]>

  // 分页状态
  hasMore: Record<string, boolean>
  cursors: Record<string, { createdAt: string; id: string } | null>

  // 加载状态
  isLoadingRooms: boolean
  isLoadingMessages: Record<string, boolean>
  isSending: Record<string, boolean>

  // Actions
  fetchRooms: () => Promise<void>
  fetchMessages: (orderId: string, cursor?: { createdAt: string; id: string }) => Promise<{ hasMore: boolean }>
  sendMessage: (orderId: string, payload: SendMessagePayload) => Promise<void>
  addMessage: (orderId: string, message: ChatMessageItem) => void
  markRoomRead: (orderId: string, lastMessageId: string) => void
  clearRoom: (orderId: string) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  rooms: [],
  totalUnread: 0,
  messages: {},
  hasMore: {},
  cursors: {},
  isLoadingRooms: false,
  isLoadingMessages: {},
  isSending: {},

  // ===== 拉取会话列表 =====
  fetchRooms: async () => {
    set({ isLoadingRooms: true })
    try {
      const res = await apiFetch('/api/chat/rooms')
      const json = await res.json()
      if (json.success) {
        const rooms = json.data as ChatRoomSummary[]
        const totalUnread = rooms.reduce((sum: number, r: ChatRoomSummary) => sum + r.unreadCount, 0)
        set({ rooms, totalUnread })
      }
    } catch {
      // 静默失败
    } finally {
      set({ isLoadingRooms: false })
    }
  },

  // ===== 拉取消息历史 =====
  fetchMessages: async (orderId: string, cursor?) => {
    const state = get()
    if (state.isLoadingMessages[orderId]) return { hasMore: true }

    set((s) => ({ isLoadingMessages: { ...s.isLoadingMessages, [orderId]: true } }))
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (cursor) {
        params.set('cursorCreatedAt', cursor.createdAt)
        params.set('cursorId', cursor.id)
      }

      const res = await apiFetch(`/api/chat/rooms/${orderId}/messages?${params}`)
      const json = await res.json()
      if (json.success) {
        const newMessages = json.data as ChatMessageItem[]
        const meta = json.meta as { hasMore: boolean; cursor: { createdAt: string; id: string } | null }

        set((s) => {
          const existing = s.messages[orderId] ?? []
          // 合并去重（cursor 分页时新消息在前面）
          const merged = cursor
            ? [...newMessages, ...existing]
            : newMessages
          // 去重
          const seen = new Set<string>()
          const deduped = merged.filter((m) => {
            if (seen.has(m.id)) return false
            seen.add(m.id)
            return true
          })

          return {
            messages: { ...s.messages, [orderId]: deduped },
            hasMore: { ...s.hasMore, [orderId]: meta.hasMore },
            cursors: { ...s.cursors, [orderId]: meta.cursor },
          }
        })

        return { hasMore: meta.hasMore }
      }
      return { hasMore: false }
    } catch {
      return { hasMore: false }
    } finally {
      set((s) => ({ isLoadingMessages: { ...s.isLoadingMessages, [orderId]: false } }))
    }
  },

  // ===== 发送消息 =====
  sendMessage: async (orderId: string, payload: SendMessagePayload) => {
    set((s) => ({ isSending: { ...s.isSending, [orderId]: true } }))
    try {
      const res = await apiFetch(`/api/chat/rooms/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json.success) {
        throw new Error(json.error?.message ?? '发送失败')
      }
      // 乐观更新：API 成功后立即添加消息到本地（不等 Socket 事件）
      // Socket 事件到达时 addMessage 会做幂等检查，不会重复添加
      const msg = json.data
      if (msg && msg.id) {
        get().addMessage(orderId, {
          id: msg.id,
          roomId: msg.roomId ?? '',
          orderId,
          senderId: msg.senderId ?? '',
          senderName: msg.senderName ?? '',
          senderAvatar: msg.senderAvatar ?? null,
          senderRole: msg.senderRole ?? null,
          type: msg.type ?? payload.type,
          content: msg.content ?? payload.content,
          fileName: msg.fileName ?? payload.fileName ?? null,
          fileSize: msg.fileSize ?? payload.fileSize ?? null,
          createdAt: msg.createdAt ?? new Date().toISOString(),
        })
      }
    } catch (err) {
      throw err
    } finally {
      set((s) => ({ isSending: { ...s.isSending, [orderId]: false } }))
    }
  },

  // ===== 添加实时消息（Socket 推送） =====
  addMessage: (orderId: string, message: ChatMessageItem) => {
    set((s) => {
      const existing = s.messages[orderId] ?? []
      // 幂等：重复消息不添加
      if (existing.some((m) => m.id === message.id)) return s

      return {
        messages: { ...s.messages, [orderId]: [...existing, message] },
      }
    })
  },

  // ===== 标记房间已读 =====
  markRoomRead: (orderId: string, _lastMessageId: string) => {
    set((s) => {
      const room = s.rooms.find((r) => r.orderId === orderId)
      if (!room) return s
      return {
        rooms: s.rooms.map((r) =>
          r.orderId === orderId ? { ...r, unreadCount: 0 } : r
        ),
        totalUnread: Math.max(0, s.totalUnread - room.unreadCount),
      }
    })
  },

  // ===== 清空房间缓存 =====
  clearRoom: (orderId: string) => {
    set((s) => {
      const { [orderId]: _, ...restMessages } = s.messages
      const { [orderId]: __, ...restHasMore } = s.hasMore
      const { [orderId]: ___, ...restCursors } = s.cursors
      return { messages: restMessages, hasMore: restHasMore, cursors: restCursors }
    })
  },
}))
