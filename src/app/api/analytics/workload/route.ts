import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import { z } from 'zod'

/**
 * GET /api/analytics/workload?month=2026-03
 * 人员负荷/绩效排行：客服绩效、资料员负荷、操作员出签率
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)
    requirePermission(user, 'analytics', 'read')

    const { month } = z.object({
      month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    }).parse(Object.fromEntries(request.nextUrl.searchParams))

    const now = new Date()
    const targetMonth = month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const [y, m] = targetMonth.split('-').map(Number)
    const monthStart = new Date(y, m - 1, 1)
    const monthEnd = new Date(y, m, 0, 23, 59, 59, 999)

    // 获取该月所有订单
    const orders = await prisma.order.findMany({
      where: {
        companyId: user.companyId,
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      select: {
        createdBy: true,
        collectorId: true,
        operatorId: true,
        amount: true,
        status: true,
      },
    })

    // 获取用户信息
    const userIds = new Set<string>()
    orders.forEach(o => {
      if (o.createdBy) userIds.add(o.createdBy)
      if (o.collectorId) userIds.add(o.collectorId)
      if (o.operatorId) userIds.add(o.operatorId)
    })

    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, realName: true, role: true },
    })
    const userMap = new Map(users.map(u => [u.id, u]))

    // 客服绩效
    const csStats: Record<string, { name: string; orders: number; revenue: number }> = {}
    orders.forEach(o => {
      const u = userMap.get(o.createdBy)
      if (!u) return
      if (!csStats[o.createdBy]) csStats[o.createdBy] = { name: u.realName, orders: 0, revenue: 0 }
      csStats[o.createdBy].orders++
      csStats[o.createdBy].revenue += Number(o.amount)
    })

    // 资料员负荷
    const collectorStats: Record<string, { name: string; orders: number }> = {}
    orders.forEach(o => {
      if (!o.collectorId) return
      const u = userMap.get(o.collectorId)
      if (!u) return
      if (!collectorStats[o.collectorId]) collectorStats[o.collectorId] = { name: u.realName, orders: 0 }
      collectorStats[o.collectorId].orders++
    })

    // 操作员绩效
    const operatorStats: Record<string, { name: string; orders: number; approved: number; rejected: number }> = {}
    orders.forEach(o => {
      if (!o.operatorId) return
      const u = userMap.get(o.operatorId)
      if (!u) return
      if (!operatorStats[o.operatorId]) operatorStats[o.operatorId] = { name: u.realName, orders: 0, approved: 0, rejected: 0 }
      operatorStats[o.operatorId].orders++
      if (o.status === 'APPROVED') operatorStats[o.operatorId].approved++
      if (o.status === 'REJECTED') operatorStats[o.operatorId].rejected++
    })

    return NextResponse.json(createSuccessResponse({
      month: targetMonth,
      csRanking: Object.values(csStats)
        .map(s => ({ ...s, revenue: Math.round(s.revenue * 100) / 100 }))
        .sort((a, b) => b.orders - a.orders),
      collectorWorkload: Object.values(collectorStats).sort((a, b) => b.orders - a.orders),
      operatorRanking: Object.values(operatorStats)
        .map(s => ({
          ...s,
          approvalRate: (s.approved + s.rejected) > 0
            ? ((s.approved / (s.approved + s.rejected)) * 100).toFixed(1) + '%'
            : '-',
        }))
        .sort((a, b) => b.orders - a.orders),
    }))
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.statusCode })
    throw error
  }
}
