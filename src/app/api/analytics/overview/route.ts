import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import { z } from 'zod'

/**
 * GET /api/analytics/overview?month=2026-03
 * 核心指标概览：总订单/营收/毛利/出签率/国家分布/支付分布
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)
    requirePermission(user, 'analytics', 'read')

    const { month } = z.object({
      month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    }).parse(Object.fromEntries(request.nextUrl.searchParams))

    // 默认当月
    const now = new Date()
    const targetMonth = month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const [y, m] = targetMonth.split('-').map(Number)
    const monthStart = new Date(y, m - 1, 1)
    const monthEnd = new Date(y, m, 0, 23, 59, 59, 999)

    const orders = await prisma.order.findMany({
      where: {
        companyId: user.companyId,
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      select: {
        status: true,
        amount: true,
        platformFee: true,
        visaFee: true,
        insuranceFee: true,
        grossProfit: true,
        targetCountry: true,
        paymentMethod: true,
        createdBy: true,
        operatorId: true,
        collectorId: true,
        applicantCount: true,
      },
    })

    const totalOrders = orders.length
    const totalApplicants = orders.reduce((sum, o) => sum + o.applicantCount, 0)
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.amount), 0)
    const totalProfit = orders.reduce((sum, o) => sum + Number(o.grossProfit ?? 0), 0)

    const approved = orders.filter(o => o.status === 'APPROVED').length
    const rejected = orders.filter(o => o.status === 'REJECTED').length
    const resolved = approved + rejected
    const approvalRate = resolved > 0 ? ((approved / resolved) * 100).toFixed(1) : '0'

    const inProgress = orders.filter(o =>
      !['APPROVED', 'REJECTED', 'DELIVERED', 'PARTIAL'].includes(o.status)
    ).length

    // 国家分布
    const byCountry: Record<string, number> = {}
    orders.forEach(o => {
      byCountry[o.targetCountry] = (byCountry[o.targetCountry] ?? 0) + 1
    })

    // 支付方式分布
    const byPayment: Record<string, number> = {}
    orders.forEach(o => {
      const pm = o.paymentMethod ?? '未指定'
      byPayment[pm] = (byPayment[pm] ?? 0) + 1
    })

    return NextResponse.json(createSuccessResponse({
      month: targetMonth,
      totalOrders,
      totalApplicants,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      profitRate: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) + '%' : '0%',
      inProgress,
      approved,
      rejected,
      approvalRate: approvalRate + '%',
      byCountry: Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 10),
      byPayment: Object.entries(byPayment).sort((a, b) => b[1] - a[1]),
    }))
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.statusCode })
    throw error
  }
}
