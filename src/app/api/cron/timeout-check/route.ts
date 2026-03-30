import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSuccessResponse, AppError } from '@/types/api'
import type { OrderStatus } from '@/types/order'

/**
 * POST /api/cron/timeout-check
 * 订单超时检测定时任务
 *
 * 检测长时间无进展的订单，创建预警通知。
 * 超时规则：
 *   - PENDING_CONNECTION > 24h：无人接单
 *   - COLLECTING_DOCS > 72h：客户未提交资料
 *   - PENDING_REVIEW > 48h：操作员未接单
 *   - MAKING_MATERIALS > 72h：材料未完成
 *   - PENDING_DELIVERY > 48h：未确认交付
 *
 * 每个订单每天最多触发一次超时通知。
 */
export async function POST(request: NextRequest) {
  try {
    const cronSecret = request.headers.get('x-cron-secret')
    if (cronSecret !== process.env.JWT_SECRET) {
      throw new AppError('FORBIDDEN', '无效的 cron 密钥', 403)
    }

    const now = new Date()

    // 超时规则
    const timeoutRules: { status: string; hours: number; message: string }[] = [
      { status: 'PENDING_CONNECTION', hours: 24, message: '待对接超过24小时，无人接单' },
      { status: 'COLLECTING_DOCS', hours: 72, message: '资料收集中超过72小时' },
      { status: 'PENDING_REVIEW', hours: 48, message: '待审核超过48小时，操作员未接单' },
      { status: 'MAKING_MATERIALS', hours: 72, message: '材料制作超过72小时' },
      { status: 'PENDING_DELIVERY', hours: 48, message: '待交付超过48小时，未确认交付' },
    ]

    let totalAlerts = 0

    for (const rule of timeoutRules) {
      const cutoff = new Date(now.getTime() - rule.hours * 60 * 60 * 1000)

      const overdueOrders = await prisma.order.findMany({
        where: {
          status: rule.status as OrderStatus,
          updatedAt: { lt: cutoff },
        },
        select: {
          id: true,
          companyId: true,
          orderNo: true,
          customerName: true,
          collectorId: true,
          operatorId: true,
          createdBy: true,
        },
      })

      for (const order of overdueOrders) {
        // 幂等性：精确到日期级别去重（同一天同订单只发一次超时预警）
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        // 检查今天是否已发过超时通知
        const existing = await prisma.notification.findFirst({
          where: {
            orderId: order.id,
            type: 'SYSTEM',
            title: { contains: '超时预警' },
            createdAt: { gte: today },
          },
        })

        if (existing) continue

        // 通知管理员 + 创建者 + 具体负责人
        const notifyUserIds = new Set<string>()
        if (order.createdBy) notifyUserIds.add(order.createdBy)
        if (order.collectorId) notifyUserIds.add(order.collectorId)
        if (order.operatorId) notifyUserIds.add(order.operatorId)

        // 查找该公司所有 COMPANY_OWNER 和 CS_ADMIN/VISA_ADMIN
        const admins = await prisma.user.findMany({
          where: {
            companyId: order.companyId,
            role: { in: ['COMPANY_OWNER', 'CS_ADMIN', 'VISA_ADMIN'] },
            status: 'ACTIVE',
          },
          select: { id: true },
        })
        admins.forEach((a) => notifyUserIds.add(a.id))

        if (notifyUserIds.size === 0) continue

        await prisma.notification.createMany({
          data: Array.from(notifyUserIds).map((userId) => ({
            companyId: order.companyId,
            userId,
            orderId: order.id,
            type: 'SYSTEM' as const,
            title: '⚠️ 超时预警',
            content: `订单 ${order.orderNo} (${order.customerName}) ${rule.message}，请及时处理`,
          })),
        })
        totalAlerts++
      }
    }

    return NextResponse.json(createSuccessResponse({
      message: `超时检测完成，共 ${totalAlerts} 条预警`,
      alertCount: totalAlerts,
    }))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}
