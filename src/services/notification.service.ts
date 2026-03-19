import { prisma } from '@/lib/prisma'
import { AppError } from '@/types/api'
import type { JwtPayload } from '@/lib/auth'

export class NotificationService {
  async list(user: JwtPayload, query: { page?: number; pageSize?: number; unreadOnly?: boolean }) {
    const page = query.page ?? 1
    const pageSize = Math.min(query.pageSize ?? 20, 100)
    const skip = (page - 1) * pageSize

    const where: Record<string, unknown> = {
      userId: user.userId,
      companyId: user.companyId,
    }

    if (query.unreadOnly) {
      where.isRead = false
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: user.userId, companyId: user.companyId, isRead: false },
      }),
    ])

    return {
      data: notifications,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        unreadCount,
      },
    }
  }

  async markAsRead(id: string, user: JwtPayload) {
    const notification = await prisma.notification.findFirst({
      where: { id, userId: user.userId },
    })

    if (!notification) {
      throw new AppError('NOTIFICATION_NOT_FOUND', '通知不存在', 404)
    }

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    })
  }

  async markAllAsRead(user: JwtPayload) {
    await prisma.notification.updateMany({
      where: { userId: user.userId, companyId: user.companyId, isRead: false },
      data: { isRead: true },
    })
  }

  async create(data: {
    userId: string
    type: string
    title: string
    content: string
    orderId?: string
    companyId: string
  }) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        content: data.content,
        orderId: data.orderId ?? null,
        companyId: data.companyId,
      },
    })
  }

  async getUnreadCount(user: JwtPayload) {
    return prisma.notification.count({
      where: {
        userId: user.userId,
        companyId: user.companyId,
        isRead: false,
      },
    })
  }
}

export const notificationService = new NotificationService()
