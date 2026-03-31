import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getCurrentUser } from '@shared/lib/auth'
import { AppError, createSuccessResponse } from '@shared/types/api'
import type { ChatRoom } from '@erp/types/chat'

// GET /api/chat/rooms/[orderId] - 获取或创建订单的聊天会话
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    // 校验订单存在 + 归属
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        companyId: user.companyId,
      },
      select: { id: true, orderNo: true, status: true },
    })
    if (!order) throw new AppError('NOT_FOUND', '订单不存在', 404)

    // 获取或创建 ChatRoom（upsert 防并发）
    const room = await prisma.chatRoom.upsert({
      where: { orderId },
      create: {
        companyId: user.companyId,
        orderId,
        title: `订单 ${order.orderNo}`,
      },
      update: {},
    })

    // 查询未读数
    const unreadResult = await prisma.$queryRaw<[{ cnt: bigint }]>`
      SELECT COUNT(*) as cnt
      FROM erp_chat_messages cm
      LEFT JOIN erp_chat_reads crd
        ON crd.room_id = ${room.id} AND crd.user_id = ${user.userId}
      WHERE cm.room_id = ${room.id}
        AND cm.id > COALESCE(crd.last_read_message_id, '')
        AND cm.sender_id != ${user.userId}
    `

    const data: ChatRoom = {
      id: room.id,
      orderId: room.orderId,
      orderNo: order.orderNo,
      title: room.title,
      status: room.status,
      lastMessage: room.lastMessage,
      lastMessageAt: room.lastMessageAt?.toISOString() ?? null,
      unreadCount: Number(unreadResult[0].cnt),
      createdAt: room.createdAt.toISOString(),
    }

    return NextResponse.json(createSuccessResponse(data))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}
