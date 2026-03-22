import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import { z } from 'zod'

/**
 * GET /api/analytics/overview?month=2026-03
 * 核心指标概览：总订单/营收/毛利/出签率/国家分布/支付分布
 *
 * 使用原生 SQL 聚合，避免全量数据加载到内存
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

    // ===== 核心指标聚合（1 次 SQL） =====
    const [agg] = await prisma.$queryRaw`
      SELECT
        COUNT(*) as totalOrders,
        COALESCE(SUM(applicant_count), 0) as totalApplicants,
        COALESCE(SUM(CAST(amount AS DECIMAL(10,2))), 0) as totalRevenue,
        COALESCE(SUM(CAST(gross_profit AS DECIMAL(10,2))), 0) as totalProfit,
        SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status NOT IN ('APPROVED','REJECTED','DELIVERED','PARTIAL') THEN 1 ELSE 0 END) as inProgress
      FROM erp_orders
      WHERE company_id = ${user.companyId}
        AND created_at >= ${monthStart}
        AND created_at <= ${monthEnd}
    ` as Array<{
      totalOrders: bigint
      totalApplicants: bigint
      totalRevenue: string
      totalProfit: string
      approved: bigint
      rejected: bigint
      inProgress: bigint
    }>

    const totalOrders = Number(agg?.totalOrders ?? 0)
    const totalApplicants = Number(agg?.totalApplicants ?? 0)
    const totalRevenue = Math.round(Number(agg?.totalRevenue ?? 0) * 100) / 100
    const totalProfit = Math.round(Number(agg?.totalProfit ?? 0) * 100) / 100
    const approved = Number(agg?.approved ?? 0)
    const rejected = Number(agg?.rejected ?? 0)
    const inProgress = Number(agg?.inProgress ?? 0)
    const resolved = approved + rejected
    const approvalRate = resolved > 0 ? ((approved / resolved) * 100).toFixed(1) + '%' : '0%'
    const profitRate = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) + '%' : '0%'

    // ===== 国家分布（SQL GROUP BY） =====
    const countryRows = await prisma.$queryRaw`
      SELECT target_country as country, COUNT(*) as cnt
      FROM erp_orders
      WHERE company_id = ${user.companyId}
        AND created_at >= ${monthStart}
        AND created_at <= ${monthEnd}
      GROUP BY target_country
      ORDER BY cnt DESC
      LIMIT 10
    ` as Array<{ country: string; cnt: bigint }>

    const byCountry: [string, number][] = countryRows.map(r => [r.country, Number(r.cnt)])

    // ===== 支付方式分布（SQL GROUP BY） =====
    const paymentRows = await prisma.$queryRaw`
      SELECT COALESCE(payment_method, '未指定') as method, COUNT(*) as cnt
      FROM erp_orders
      WHERE company_id = ${user.companyId}
        AND created_at >= ${monthStart}
        AND created_at <= ${monthEnd}
      GROUP BY COALESCE(payment_method, '未指定')
      ORDER BY cnt DESC
    ` as Array<{ method: string; cnt: bigint }>

    const byPayment: [string, number][] = paymentRows.map(r => [r.method, Number(r.cnt)])

    return NextResponse.json(createSuccessResponse({
      month: targetMonth,
      totalOrders,
      totalApplicants,
      totalRevenue,
      totalProfit,
      profitRate,
      inProgress,
      approved,
      rejected,
      approvalRate,
      byCountry,
      byPayment,
    }))
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.statusCode })
    throw error
  }
}
