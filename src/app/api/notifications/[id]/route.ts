import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@shared/lib/auth'
import { AppError, createSuccessResponse } from '@shared/types/api'
import { prisma } from '@shared/lib/prisma'

// PATCH /api/notifications/[id] - 标记单条已读
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    const notification = await prisma.notification.findFirst({
      where: { id: id, userId: user.userId },
    })

    if (!notification) {
      throw new AppError('NOT_FOUND', '通知不存在', 404)
    }

    const updated = await prisma.notification.update({
      where: { id: id },
      data: { isRead: true },
    })

    return NextResponse.json(createSuccessResponse(updated))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}
