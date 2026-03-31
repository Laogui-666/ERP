import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getCurrentUser } from '@shared/lib/auth'
import { AppError, createSuccessResponse } from '@shared/types/api'
import { emitToRoom } from '@shared/lib/socket'
import { z } from 'zod'

const markReadSchema = z.object({
  lastReadMessageId: z.string().min(1),
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

    const body = await request.json()
    const data = markReadSchema.parse(body)

    // 查询会话
    const room = await prisma.chatRoom.findFirst({
      where: { orderId, companyId: user.companyId },
      select: { id: true },
    })
    if (!room) throw new AppError('NOT_FOUND', '聊天会话不存在', 404)

    // upsert 已读位置
    await prisma.chatRead.upsert({
      where: {
        roomId_userId: { roomId: room.id, userId: user.userId },
      },
      update: { lastReadMessageId: data.lastReadMessageId },
      create: {
        roomId: room.id,
        userId: user.userId,
        lastReadMessageId: data.lastReadMessageId,
      },
    })

    // Socket 推送已读回执
    emitToRoom(`order:${orderId}`, 'chat:read', {
      orderId,
      userId: user.userId,
      realName: user.realName,
      lastReadMessageId: data.lastReadMessageId,
    })

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
