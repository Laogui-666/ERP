import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { AppError, createSuccessResponse } from '@/types/api'
import type { ChatRoomSummary } from '@/types/chat'

// GET /api/chat/rooms - 我的会话列表（含未读数 + 最后消息）
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    // 超级管理员查所有，其他角色按订单关联过滤
    const isSuperAdmin = user.role === 'SUPER_ADMIN'
    const isManager = ['COMPANY_OWNER', 'CS_ADMIN', 'VISA_ADMIN'].includes(user.role)

    // 原生 SQL — MySQL 兼容（不用 NULLS LAST）
    // 未读数 = ChatMessage.id > ChatRead.lastReadMessageId（cuid 可按字典序比较）
    const rooms = await prisma.$queryRaw<ChatRoomSummary[]>`
      SELECT
        cr.order_id as orderId,
        o.order_no as orderNo,
        cr.title,
        cr.status,
        cr.last_message as lastMessage,
        DATE_FORMAT(cr.last_message_at, '%Y-%m-%dT%H:%i:%s.000Z') as lastMessageAt,
        DATE_FORMAT(cr.created_at, '%Y-%m-%dT%H:%i:%s.000Z') as createdAt,
        COALESCE(unread.cnt, 0) as unreadCount
      FROM erp_chat_rooms cr
      INNER JOIN erp_orders o ON o.id = cr.order_id
      LEFT JOIN (
        SELECT
          cm.room_id,
          COUNT(*) as cnt
        FROM erp_chat_messages cm
        LEFT JOIN erp_chat_reads crd
          ON crd.room_id = cm.room_id AND crd.user_id = ${user.userId}
        WHERE cm.id > COALESCE(crd.last_read_message_id, '')
          AND cm.sender_id != ${user.userId}
          AND cm.room_id IN (SELECT id FROM erp_chat_rooms WHERE company_id = ${user.companyId})
        GROUP BY cm.room_id
      ) unread ON unread.room_id = cr.id
      WHERE cr.company_id = ${user.companyId}
        AND cr.status != 'ARCHIVED'
        ${
          isSuperAdmin
            ? prisma.$queryRaw``
            : isManager
              ? prisma.$queryRaw``
              : prisma.$queryRaw`AND (o.customer_id = ${user.userId}
                OR o.collector_id = ${user.userId}
                OR o.operator_id = ${user.userId}
                OR o.created_by = ${user.userId})`
        }
      ORDER BY cr.last_message_at IS NULL, cr.last_message_at DESC
      LIMIT 50
    `

    // BigInt → number 转换（MySQL COUNT 返回 bigint）
    const data = rooms.map((r) => ({
      ...r,
      unreadCount: Number((r as unknown as Record<string, unknown>).unreadCount),
    }))

    return NextResponse.json(createSuccessResponse(data))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}
