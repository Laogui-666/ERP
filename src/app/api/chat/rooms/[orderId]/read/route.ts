import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getCurrentUser } from '@shared/lib/auth'
import { AppError, createSuccessResponse } from '@shared/types/api'
import { emitToRoom } from '@shared/lib/socket'
import { z } from 'zod'

const markReadSchema = z.object({
  lastReadMessageId: z.string().min(1).optional(),
})

// POST /api/chat/rooms/[orderId]/read - 标记已读
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    // 解析请求体（支持空 body）
    let body: Record<string, unknown> = {}
    try {
      const text = await request.text()
      if (text) body = JSON.parse(text)
    } catch {
      body = {}
    }
    const data = markReadSchema.parse(body)

    // 查询会话
    const room = await prisma.chatRoom.findFirst({
      where: { orderId, companyId: user.companyId },
      select: { id: true },
    })
    if (!room) throw new AppError('NOT_FOUND', '聊天会话不存在', 404)

    // 获取最新消息ID（如未指定，取当前会话最新消息）
    let lastReadId = data.lastReadMessageId
    if (!lastReadId) {
      const latestMsg = await prisma.chatMessage.findFirst({
        where: { roomId: room.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      })
      lastReadId = latestMsg?.id
    }

    // upsert 已读位置
    if (lastReadId) {
      await prisma.chatRead.upsert({
        where: {
          roomId_userId: { roomId: room.id, userId: user.userId },
        },
        update: { lastReadMessageId: lastReadId },
        create: {
          roomId: room.id,
          userId: user.userId,
          lastReadMessageId: lastReadId,
        },
      })
    }

    // Socket 推送已读回执
    if (lastReadId) {
      emitToRoom(`order:${orderId}`, 'chat:read', {
        orderId,
        userId: user.userId,
        realName: user.realName,
        lastReadMessageId: lastReadId,
      })
    }

    return NextResponse.json(createSuccessResponse({ message: '已标记已读' }))
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
