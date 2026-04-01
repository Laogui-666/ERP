// M4: 聊天相关类型定义

export interface ChatRoom {
  id: string
  orderId: string
  orderNo?: string
  title: string
  status: 'ACTIVE' | 'ARCHIVED' | 'MUTED'
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
  createdAt: string
}

export interface ChatMessageItem {
  id: string
  roomId: string
  orderId: string
  senderId: string
  senderName: string
  senderAvatar: string | null
  senderRole: string | null
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'
  content: string
  fileName: string | null
  fileSize: number | null
  createdAt: string
}

export interface SendMessagePayload {
  type: 'TEXT' | 'IMAGE' | 'FILE'
  content: string          // TEXT: 文本内容 / IMAGE/FILE: ossUrl
  fileName?: string
  fileSize?: number
}

export interface ChatRoomSummary {
  orderId: string
  orderNo: string
  title: string
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
  status: 'ACTIVE' | 'ARCHIVED' | 'MUTED'
}

// Socket 事件 payload — 从 shared 层统一导出
export type {
  ChatMessageSocketPayload,
  ChatTypingPayload,
  ChatReadPayload,
} from '@shared/types/socket-events'
