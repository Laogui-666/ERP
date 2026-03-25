'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseSocketOptions {
  onNotification?: (data: {
    type: string
    title: string
    orderId?: string
    orderNo?: string
  }) => void
}

// 全局单例：跨页面复用
let socketInstance: Socket | null = null

export function useSocketClient(options: UseSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(socketInstance?.connected ?? false)
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    // 已有连接且存活 → 复用，只更新回调
    if (socketInstance?.connected) {
      setIsConnected(true)
      return
    }

    // 如果有残留的断开连接，先清理
    if (socketInstance) {
      socketInstance.removeAllListeners()
      socketInstance.disconnect()
      socketInstance = null
    }

    const socket = io({
      // 不传 auth.token，依赖 HttpOnly Cookie 自动携带
      // socket.ts 服务端已改造为 Cookie fallback 认证
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

    socket.on('notification', (data) => {
      optionsRef.current.onNotification?.(data)
    })

    // Tab 恢复前台时主动重连
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !socket.connected) {
        socket.connect()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      // 不断开，其他页面复用
    }
  }, [])

  // 手动断开（登出时调用）
  const disconnect = useCallback(() => {
    if (socketInstance) {
      socketInstance.removeAllListeners()
      socketInstance.disconnect()
      socketInstance = null
      setIsConnected(false)
    }
  }, [])

  return { isConnected, disconnect }
}
