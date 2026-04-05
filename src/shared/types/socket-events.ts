// Socket.io 事件 payload 类型
// 这些类型被 shared 层 (use-socket-client) 和业务模块共同使用
// 属于共享基础设施层

export interface ChatMessageSocketPayload {
  id: string
  roomId: string
  orderId: string
  senderId: string
  senderName: string
  senderAvatar: string | null
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'
  content: string
  fileName?: string | null
  fileSize?: number | null
  createdAt: string
}

export interface ChatTypingPayload {
  orderId: string
  userId: string
  realName: string
}

export interface ChatReadPayload {
  orderId: string
  userId: string
  realName: string
  lastReadMessageId: string
}
