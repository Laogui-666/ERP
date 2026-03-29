import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { AppError, createSuccessResponse } from '@/types/api'
import { emitToRoom, emitToUser } from '@/lib/socket'
import { logApiError } from '@/lib/logger'
import { z } from 'zod'
import type { ChatMessageItem } from '@/types/chat'

// GET /api/chat/rooms/[orderId]/messages - 消息历史（复合游标分页）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    // 查询会话
    const room = await prisma.chatRoom.findFirst({
      where: { orderId, companyId: user.companyId },
      select: { id: true },
    })
    if (!room) throw new AppError('NOT_FOUND', '聊天会话不存在', 404)

    // 游标参数
    const cursorCreatedAt = request.nextUrl.searchParams.get('cursorCreatedAt')
    const cursorId = request.nextUrl.searchParams.get('cursorId')
    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? '50'), 100)

    // 复合游标：(createdAt, id) — 防同时间戳丢失
    const cursorWhere = cursorCreatedAt && cursorId
      ? {
          OR: [
            { createdAt: { lt: new Date(cursorCreatedAt) } },
            {
              createdAt: new Date(cursorCreatedAt),
              id: { lt: cursorId },
            },
          ],
        }
      : {}

    const messages = await prisma.chatMessage.findMany({
      where: {
        roomId: room.id,
        ...cursorWhere,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1, // 多取 1 条判断 hasMore
      include: {
        sender: {
          select: { id: true, realName: true, avatar: true, role: true },
        },
      },
    })

    const hasMore = messages.length > limit
    if (hasMore) messages.pop()

    const data: ChatMessageItem[] = messages.reverse().map((m) => ({
      id: m.id,
      roomId: m.roomId,
      orderId,
      senderId: m.senderId,
      senderName: m.sender.realName,
      senderAvatar: m.sender.avatar,
      senderRole: m.sender.role,
      type: m.type,
      content: m.content,
      fileName: m.fileName,
      fileSize: m.fileSize,
      createdAt: m.createdAt.toISOString(),
    }))

    return NextResponse.json(createSuccessResponse(data, {
      hasMore,
      cursor: data.length > 0
        ? { createdAt: data[0].createdAt, id: data[0].id }
        : null,
    }))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}

// ==================== 发送消息 ====================

const sendMessageSchema = z.object({
  type: z.enum(['TEXT', 'IMAGE', 'FILE']),
  content: z.string().min(1).max(2000),
  fileName: z.string().max(255).optional(),
  fileSize: z.number().int().positive().optional(),
})

// POST /api/chat/rooms/[orderId]/messages - 发送消息
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    const body = await request.json()
    const data = sendMessageSchema.parse(body)

    // 获取会话（不存在则自动创建）
    const order = await prisma.order.findFirst({
      where: { id: orderId, companyId: user.companyId },
      select: { id: true, orderNo: true },
    })
    if (!order) throw new AppError('NOT_FOUND', '订单不存在', 404)

    const room = await prisma.chatRoom.upsert({
      where: { orderId },
      create: {
        companyId: user.companyId,
        orderId,
        title: `订单 ${order.orderNo}`,
      },
      update: {},
    })

    // 事务：创建消息 + 更新 ChatRoom 摘要
    const message = await prisma.$transaction(async (tx) => {
      // exactOptionalPropertyTypes 兼容：条件赋值
      const messageData: Record<string, unknown> = {
        roomId: room.id,
        companyId: user.companyId,
        senderId: user.userId,
        type: data.type,
        content: data.content,
      }
      if (data.fileName !== undefined) messageData.fileName = data.fileName
      if (data.fileSize !== undefined) messageData.fileSize = data.fileSize

      const msg = await tx.chatMessage.create({
        data: messageData as Parameters<typeof tx.chatMessage.create>[0]['data'],
      })

      // 更新会话摘要
      await tx.chatRoom.update({
        where: { id: room.id },
        data: {
          lastMessage: data.type === 'TEXT'
            ? data.content.slice(0, 100)
            : `[${data.type === 'IMAGE' ? '图片' : '文件'}]`,
          lastMessageAt: msg.createdAt,
        },
      })

      return msg
    })

    // Socket 推送（事务外，失败不影响数据一致性）
    emitToRoom(`order:${orderId}`, 'chat:message', {
      id: message.id,
      roomId: room.id,
      orderId,
      senderId: user.userId,
      senderName: user.realName,
      senderAvatar: user.avatar,
      type: message.type,
      content: message.content,
      fileName: message.fileName ?? null,
      fileSize: message.fileSize ?? null,
      createdAt: message.createdAt.toISOString(),
    })

    // 离线消息通知：给订单相关用户创建 Notification（5 分钟去重）
    try {
      const orderDetail = await prisma.order.findUnique({
        where: { id: orderId },
        select: { customerId: true, collectorId: true, operatorId: true, createdBy: true, orderNo: true },
      })
      if (orderDetail) {
        const relatedUserIds = [
          orderDetail.customerId,
          orderDetail.collectorId,
          orderDetail.operatorId,
          orderDetail.createdBy,
        ].filter((id): id is string => !!id && id !== user.userId)

        const notificationContent = data.type === 'TEXT'
          ? `${user.realName}: ${data.content.slice(0, 80)}`
          : `${user.realName}: 发送了${data.type === 'IMAGE' ? '图片' : '文件'}`

        for (const targetUserId of relatedUserIds) {
          const recent = await prisma.notification.findFirst({
            where: {
              userId: targetUserId,
              orderId,
              type: 'CHAT_MESSAGE',
              createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
            },
          })
          if (!recent) {
            await prisma.notification.create({
              data: {
                companyId: user.companyId,
                userId: targetUserId,
                orderId,
                type: 'CHAT_MESSAGE',
                title: `订单 ${orderDetail.orderNo} 有新消息`,
                content: notificationContent,
              },
            })
            emitToUser(targetUserId, 'notification', {
              type: 'CHAT_MESSAGE',
              title: '有新消息',
              orderId,
              orderNo: orderDetail.orderNo,
            })
          }
        }
      }
    } catch (err) {
      logApiError('chat-offline-notification', err, { orderId })
    }

    return NextResponse.json(createSuccessResponse({
      id: message.id,
      createdAt: message.createdAt.toISOString(),
    }), { status: 201 })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        new AppError('VALIDATION_ERROR', '参数校验失败', 400, error.errors).toJSON(),
        { status: 400 }
      )
    }
    throw error
  }
}
