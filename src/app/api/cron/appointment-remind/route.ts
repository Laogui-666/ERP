import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { createSuccessResponse, AppError } from '@shared/types/api'

/**
 * POST /api/cron/appointment-remind
 * 预约提醒定时任务
 *
 * 查找未来 24 小时内有预约的订单，为相关用户创建站内通知。
 * 已发送过的提醒不重复发送（通过检查是否已有同类型同订单通知判断）。
 *
 * 调用方式：内部 cron 或外部定时器 POST 此端点
 * 鉴权：使用 cron secret header
 */
export async function POST(request: NextRequest) {
  try {
    // 简单鉴权：cron secret
    const cronSecret = request.headers.get('x-cron-secret')
    if (cronSecret !== process.env.JWT_SECRET) {
      throw new AppError('FORBIDDEN', '无效的 cron 密钥', 403)
    }

    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // 查找有预约日期且在未来 24 小时内的进行中订单
    const orders = await prisma.order.findMany({
      where: {
        appointmentDate: {
          gte: now,
          lte: tomorrow,
        },
        status: {
          in: ['COLLECTING_DOCS', 'PENDING_REVIEW', 'UNDER_REVIEW', 'MAKING_MATERIALS', 'PENDING_DELIVERY'],
        },
      },
      select: {
        id: true,
        companyId: true,
        orderNo: true,
        customerName: true,
        appointmentDate: true,
        collectorId: true,
        operatorId: true,
        customerId: true,
        createdBy: true,
        targetCountry: true,
      },
    })

    if (orders.length === 0) {
      return NextResponse.json(createSuccessResponse({
        message: '无需提醒的预约',
        count: 0,
      }))
    }

    let totalNotified = 0

    for (const order of orders) {
      // 确定需要通知的用户
      const notifyUserIds = new Set<string>()
      if (order.collectorId) notifyUserIds.add(order.collectorId)
      if (order.operatorId) notifyUserIds.add(order.operatorId)
      if (order.customerId) notifyUserIds.add(order.customerId)

      if (notifyUserIds.size === 0) continue

      const appointmentDateStr = order.appointmentDate
        ? new Date(order.appointmentDate).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '未知'

      // 幂等性：精确到日期级别去重（同一天同订单同类型只发一次）
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      // 批量创建通知（跳过已有相同提醒的用户）
      for (const userId of notifyUserIds) {
        // 检查今天是否已发过同类型同订单提醒
        const existing = await prisma.notification.findFirst({
          where: {
            userId,
            orderId: order.id,
            type: 'APPOINTMENT_REMIND',
            createdAt: { gte: today },
          },
        })

        if (existing) continue

        await prisma.notification.create({
          data: {
            companyId: order.companyId,
            userId,
            orderId: order.id,
            type: 'APPOINTMENT_REMIND',
            title: '预约提醒',
            content: `订单 ${order.orderNo} (${order.customerName} · ${order.targetCountry}) 预约时间为 ${appointmentDateStr}，请及时准备`,
          },
        })
        totalNotified++
      }
    }

    return NextResponse.json(createSuccessResponse({
      message: `已为 ${orders.length} 个订单发送 ${totalNotified} 条预约提醒`,
      orderCount: orders.length,
      notificationCount: totalNotified,
    }))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}
