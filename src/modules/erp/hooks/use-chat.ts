'use client'

import { useEffect, useRef, useCallback, useMemo } from 'react'
import { useChatStore } from '@erp/stores/chat-store'
import { useAuth } from '@shared/hooks/use-auth'
import {
  joinRoom,
  leaveRoom,
  sendTyping,
  socketMarkRead,
  registerChatMessageHandler,
  registerChatReadHandler,
} from '@shared/hooks/use-socket-client'
import { apiFetch } from '@shared/lib/api-client'
import type { SendMessagePayload } from '@erp/types/chat'

interface UseChatOptions {
  orderId: string
  autoJoin?: boolean // 默认 true
}

export function useChat({ orderId, autoJoin = true }: UseChatOptions) {
  const { user } = useAuth()
  const {
    messages,
    hasMore,
    isLoadingMessages,
    isSending,
    fetchMessages,
    sendMessage: storeSendMessage,
    addMessage,
    markRoomRead,
  } = useChatStore()

  const roomMessages = messages[orderId] ?? []
  const roomHasMore = hasMore[orderId] ?? true
  const roomIsLoading = isLoadingMessages[orderId] ?? false
  const roomIsSending = isSending[orderId] ?? false

  // typing 防抖
  const lastTypingRef = useRef(0)

  // ===== 注册 Socket 事件回调 =====
  const handlerId = useMemo(() => `chat-${orderId}`, [orderId])

  useEffect(() => {
    if (!autoJoin) return

    // 加入房间
    joinRoom(orderId)

    // 注册消息回调
    const unregisterMsg = registerChatMessageHandler(handlerId, (data) => {
      if (data.orderId === orderId) {
        addMessage(orderId, {
          id: data.id,
          roomId: data.roomId,
          orderId: data.orderId,
          senderId: data.senderId,
          senderName: data.senderName,
          senderAvatar: data.senderAvatar,
          senderRole: null,
          type: data.type,
          content: data.content,
          fileName: data.fileName ?? null,
          fileSize: data.fileSize ?? null,
          createdAt: data.createdAt,
        })
      }
    })

    // 注册已读回执回调
    const unregisterRead = registerChatReadHandler(handlerId, (data) => {
      if (data.orderId === orderId && data.userId !== user?.id) {
        // 可以在这里更新"对方已读"状态
      }
    })

    return () => {
      unregisterMsg()
      unregisterRead()
      leaveRoom(orderId)
    }
  }, [orderId, autoJoin, handlerId, addMessage, user?.id])

  // ===== 首次加载 =====
  const hasLoadedRef = useRef(false)
  useEffect(() => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    fetchMessages(orderId)
  }, [orderId, fetchMessages])

  // ===== 发送消息 =====
  const sendMessage = useCallback(
    async (payload: SendMessagePayload) => {
      if (roomIsSending) return
      try {
        await storeSendMessage(orderId, payload)
      } catch (err) {
        throw err
      }
    },
    [orderId, roomIsSending, storeSendMessage]
  )

  // ===== 加载更多历史 =====
  const loadMore = useCallback(async () => {
    if (roomIsLoading || !roomHasMore) return { hasMore: roomHasMore }
    const cursor = useChatStore.getState().cursors[orderId]
    if (!cursor) return { hasMore: false }
    return fetchMessages(orderId, cursor)
  }, [orderId, roomIsLoading, roomHasMore, fetchMessages])

  // ===== 输入状态通知 =====
  const handleTyping = useCallback(() => {
    const now = Date.now()
    if (now - lastTypingRef.current < 2000) return // 客户端 2s 防抖
    lastTypingRef.current = now
    sendTyping(orderId)
  }, [orderId])

  // ===== 标记已读 =====
  const markRead = useCallback(
    (lastMessageId: string) => {
      // Socket 实时推送（服务端 3s debounce）
      socketMarkRead(orderId, lastMessageId)
      // 本地 store 即时更新角标
      markRoomRead(orderId, lastMessageId)
      // API 持久化（Socket 断连时兜底）
      apiFetch(`/api/chat/rooms/${orderId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastReadMessageId: lastMessageId }),
      }).catch(() => { /* 静默失败，Socket 通道为主 */ })
    },
    [orderId, markRoomRead]
  )

  return {
    messages: roomMessages,
    hasMore: roomHasMore,
    isLoading: roomIsLoading,
    isSending: roomIsSending,
    sendMessage,
    loadMore,
    handleTyping,
    markRead,
    userId: user?.id,
  }
}
