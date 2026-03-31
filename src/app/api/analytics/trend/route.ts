import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getCurrentUser } from '@shared/lib/auth'
import { requirePermission } from '@shared/lib/rbac'
import { AppError, createSuccessResponse } from '@shared/types/api'
import { z } from 'zod'

/**
 * GET /api/analytics/trend?months=6
 * 月度趋势数据（原生 SQL GROUP BY，1次查询搞定多月聚合）
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)
    requirePermission(user, 'analytics', 'read')

    const { months } = z.object({
      months: z.coerce.number().int().min(1).max(24).default(6),
    }).parse(Object.fromEntries(request.nextUrl.searchParams))

    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months + 1)
    startDate.setDate(1)
    startDate.setHours(0, 0, 0, 0)

    // 原生 SQL GROUP BY — 1次查询搞定
    const raw = await prisma.$queryRaw`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as orders,
        COALESCE(SUM(CAST(amount AS DECIMAL(10,2))), 0) as revenue,
        COALESCE(SUM(CAST(gross_profit AS DECIMAL(10,2))), 0) as profit,
        SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected
      FROM erp_orders
      WHERE company_id = ${user.companyId}
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    ` as Array<{
      month: string
      orders: bigint
      revenue: string
      profit: string
      approved: bigint
      rejected: bigint
    }>

    // MySQL 返回 bigint，需要 Number() 转换
    const data = raw.map(row => ({
      month: row.month,
      orders: Number(row.orders),
      revenue: Math.round(Number(row.revenue) * 100) / 100,
      profit: Math.round(Number(row.profit) * 100) / 100,
      approved: Number(row.approved),
      rejected: Number(row.rejected),
    }))

    return NextResponse.json(createSuccessResponse(data))
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.statusCode })
    throw error
  }
}
