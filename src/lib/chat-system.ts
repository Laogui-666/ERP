import { prisma } from '@/lib/prisma'
import { emitToRoom } from '@/lib/socket'
import { logApiError } from '@/lib/logger'

const SYSTEM_USER_ID = 'chat_system'

/**
 * 发送系统消息到订单聊天
 * - 写入 DB（ChatMessage + 更新 ChatRoom 摘要）
 * - Socket 推送到 order:{orderId} 房间
 * - 如果 ChatRoom 不存在（旧订单），静默跳过
 */
export async function sendSystemMessage(
  orderId: string,
  companyId: string,
  content: string,
) {
  try {
    const room = await prisma.chatRoom.findUnique({
      where: { orderId },
      select: { id: true },
    })
    if (!room) return undefined

    const message = await prisma.chatMessage.create({
      data: {
        roomId: room.id,
        companyId,
        senderId: SYSTEM_USER_ID,
        type: 'SYSTEM',
        content,
      },
    })

    // 更新 ChatRoom 摘要
    await prisma.chatRoom.update({
      where: { id: room.id },
      data: {
        lastMessage: content.slice(0, 100),
        lastMessageAt: new Date(),
      },
    })

    // Socket 推送
    emitToRoom(`order:${orderId}`, 'chat:message', {
      id: message.id,
      roomId: room.id,
      orderId,
      senderId: SYSTEM_USER_ID,
      senderName: '系统',
      senderAvatar: null,
      type: 'SYSTEM',
      content,
      createdAt: message.createdAt.toISOString(),
    })

    return message
  } catch (err) {
    logApiError('chat-system-message', err, { orderId })
    return undefined
  }
}

/**
 * 归档聊天室（订单终态时调用）
 */
export async function archiveChatRoom(orderId: string): Promise<void> {
  try {
    await prisma.chatRoom.updateMany({
      where: { orderId, status: 'ACTIVE' },
      data: { status: 'ARCHIVED' },
    })
  } catch (err) {
    logApiError('chat-room-archive', err, { orderId })
  }
}
