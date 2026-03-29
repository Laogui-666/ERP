'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type { ChatMessageSocketPayload, ChatTypingPayload, ChatReadPayload } from '@/types/chat'

// ==================== 回调注册表 ====================
// 多组件共享单例 socket，通过注册表分发事件

type NotificationHandler = (data: {
  type: string
  title: string
  orderId?: string
  orderNo?: string
}) => void
type ChatMessageHandler = (data: ChatMessageSocketPayload) => void
type ChatTypingHandler = (data: ChatTypingPayload) => void
type ChatReadHandler = (data: ChatReadPayload) => void

type ChatErrorHandler = (data: { message: string }) => void

const notificationHandlers = new Map<string, NotificationHandler>()
const chatMessageHandlers = new Map<string, ChatMessageHandler>()
const chatTypingHandlers = new Map<string, ChatTypingHandler>()
const chatReadHandlers = new Map<string, ChatReadHandler>()
const chatErrorHandlers = new Map<string, ChatErrorHandler>()

// 已设置 socket 事件分发的标记（只设置一次）
let dispatchersInitialized = false

export function registerNotificationHandler(id: string, handler: NotificationHandler) {
  notificationHandlers.set(id, handler)
  return () => { notificationHandlers.delete(id) }
}

export function registerChatMessageHandler(id: string, handler: ChatMessageHandler) {
  chatMessageHandlers.set(id, handler)
  return () => { chatMessageHandlers.delete(id) }
}

export function registerChatTypingHandler(id: string, handler: ChatTypingHandler) {
  chatTypingHandlers.set(id, handler)
  return () => { chatTypingHandlers.delete(id) }
}

export function registerChatReadHandler(id: string, handler: ChatReadHandler) {
  chatReadHandlers.set(id, handler)
  return () => { chatReadHandlers.delete(id) }
}

export function registerChatErrorHandler(id: string, handler: ChatErrorHandler) {
  chatErrorHandlers.set(id, handler)
  return () => { chatErrorHandlers.delete(id) }
}

// ==================== Socket 操作方法 ====================

export function joinRoom(orderId: string) {
  socketInstance?.emit('chat:join', { orderId })
}

export function leaveRoom(orderId: string) {
  socketInstance?.emit('chat:leave', { orderId })
}

export function sendTyping(orderId: string) {
  socketInstance?.emit('chat:typing', { orderId })
}

export function socketMarkRead(orderId: string, lastReadMessageId: string) {
  socketInstance?.emit('chat:mark-read', { orderId, lastReadMessageId })
}

// ==================== 全局单例 ====================

let socketInstance: Socket | null = null

function initDispatchers(socket: Socket) {
  if (dispatchersInitialized) return
  dispatchersInitialized = true

  socket.on('notification', (data) => {
    for (const handler of notificationHandlers.values()) {
      try { handler(data) } catch { /* ignore individual handler errors */ }
    }
  })

  socket.on('chat:message', (data: ChatMessageSocketPayload) => {
    for (const handler of chatMessageHandlers.values()) {
      try { handler(data) } catch { /* ignore */ }
    }
  })

  socket.on('chat:typing', (data: ChatTypingPayload) => {
    for (const handler of chatTypingHandlers.values()) {
      try { handler(data) } catch { /* ignore */ }
    }
  })

  socket.on('chat:read', (data: ChatReadPayload) => {
    for (const handler of chatReadHandlers.values()) {
      try { handler(data) } catch { /* ignore */ }
    }
  })

  socket.on('chat:error', (data: { message: string }) => {
    for (const handler of chatErrorHandlers.values()) {
      try { handler(data) } catch { /* ignore */ }
    }
  })
}

// ==================== Hook ====================

interface UseSocketOptions {
  /** @deprecated 使用 registerNotificationHandler 替代 */
  onNotification?: NotificationHandler
}

export function useSocketClient(options: UseSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(socketInstance?.connected ?? false)
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    // 已有连接 → 确保分发器已初始化，更新状态
    if (socketInstance?.connected) {
      initDispatchers(socketInstance)
      setIsConnected(true)
      // 兼容旧模式：注册 onNotification 回调
      if (optionsRef.current.onNotification) {
        const id = `_legacy_${Date.now()}`
        notificationHandlers.set(id, optionsRef.current.onNotification)
        return () => { notificationHandlers.delete(id) }
      }
      return
    }

    // 如果有残留的断开连接，先清理
    if (socketInstance) {
      socketInstance.removeAllListeners()
      socketInstance.disconnect()
      socketInstance = null
      dispatchersInitialized = false
    }

    const socket = io({
      // 不传 auth.token，依赖 HttpOnly Cookie 自动携带
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    })

    socketInstance = socket

    socket.on('connect', () => {
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('connect_error', () => {
      setIsConnected(false)
    })

    // 初始化事件分发器
    initDispatchers(socket)

    // 兼容旧模式
    if (optionsRef.current.onNotification) {
      const id = `_legacy_${Date.now()}`
      notificationHandlers.set(id, optionsRef.current.onNotification)
    }

    // Tab 恢复前台时主动重连
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !socket.connected) {
        socket.connect()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      // 清理 legacy handler
      if (optionsRef.current.onNotification) {
        // 注意：这里无法精确删除，因为 id 在闭包中
        // 但 legacy 模式仅用于 layout.tsx，不会卸载
      }
      // 不断开 socket，其他页面复用
    }
  }, [])

  // 手动断开（登出时调用）
  const disconnect = useCallback(() => {
    if (socketInstance) {
      socketInstance.removeAllListeners()
      socketInstance.disconnect()
      socketInstance = null
      dispatchersInitialized = false
      setIsConnected(false)
    }
  }, [])

  return { isConnected, disconnect }
}
