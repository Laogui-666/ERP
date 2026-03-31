import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getCurrentUser } from '@shared/lib/auth'
import { requirePermission } from '@shared/lib/rbac'
import { AppError } from '@shared/types/api'
import { ORDER_STATUS_LABELS } from '@erp/types/order'
import { formatDate } from '@shared/lib/utils'
import { z } from 'zod'

/**
 * GET /api/analytics/export?month=2026-03&format=xlsx
 * Excel 导出 — 23列完全对齐手工表格式
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)
    requirePermission(user, 'analytics', 'read')

    const params = z.object({
      month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      format: z.enum(['xlsx', 'csv']).default('xlsx'),
    }).parse(Object.fromEntries(request.nextUrl.searchParams))

    // 确定日期范围
    let gte: Date, lte: Date
    if (params.month) {
      const [y, m] = params.month.split('-').map(Number)
      gte = new Date(y, m - 1, 1)
      lte = new Date(y, m, 0, 23, 59, 59, 999)
    } else if (params.startDate && params.endDate) {
      gte = new Date(params.startDate)
      lte = new Date(params.endDate + 'T23:59:59')
    } else {
      const now = new Date()
      gte = new Date(now.getFullYear(), now.getMonth(), 1)
      lte = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    }

    // 查询订单 + 关联申请人 + 用户
    const orders = await prisma.order.findMany({
      where: {
        companyId: user.companyId,
        createdAt: { gte, lte },
      },
      include: {
        applicants: { orderBy: { sortOrder: 'asc' } },
        creator: { select: { realName: true } },
        collector: { select: { realName: true } },
        operator: { select: { realName: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    // 动态导入 xlsx（避免 SSR 体积）
    const XLSX = await import('xlsx')

    // 构建数据行
    const rows: unknown[][] = []
    let seq = 1

    for (const order of orders) {
      const applicants = order.applicants.length > 0 ? order.applicants : [{ name: order.customerName, visaResult: null, visaResultAt: null }]

      for (let i = 0; i < applicants.length; i++) {
        const a = applicants[i]
        const isFirst = i === 0

        rows.push([
          isFirst ? seq : '',                                              // A 序号
          isFirst ? (order.contactName ?? order.customerName) : '',       // B 联系人
          a.name,                                                         // C 申请人
          isFirst ? order.customerPhone : '',                              // D 手机号
          isFirst ? order.targetCountry : '',                              // E 国家
          isFirst ? (order.targetCity ?? '') : '',                         // F 城市
          isFirst ? (order.visaCategory ?? '') : '',                       // G 套餐
          isFirst ? (order.remark ?? '') : '',                             // H 备注
          isFirst ? formatDate(order.createdAt) : '',                      // I 下单时间
          isFirst ? (order.creator?.realName ?? '') : '',                  // J 接待客服
          isFirst ? (order.collector?.realName ?? '') : '',                // K 资料收集
          isFirst ? (ORDER_STATUS_LABELS[order.status] ?? order.status) : '', // L 平台进度
          isFirst ? formatDate(order.submittedAt) : '',                    // M 递交日期
          a.visaResultAt ? formatDate(a.visaResultAt) : '',                // N 出签时间
          isFirst ? (order.operator?.realName ?? '') : '',                 // O 操作专员
          isFirst ? (order.externalOrderNo ?? order.orderNo) : '',         // P 订单编号
          isFirst ? Number(order.amount) : '',                             // Q 订单金额
          isFirst ? (order.paymentMethod ?? '') : '',                      // R 支付方式
          isFirst && order.platformFeeRate ? `${(Number(order.platformFeeRate) * 100).toFixed(1)}%` : '', // S 平台扣点
          isFirst && order.platformFee ? Number(order.platformFee) : '',   // T 平台费用
          isFirst && order.visaFee ? Number(order.visaFee) : '',           // U 签证费
          isFirst && order.insuranceFee ? Number(order.insuranceFee) : '', // V 保险
          isFirst && order.rejectionInsurance ? Number(order.rejectionInsurance) : '', // W 拒签保险
        ])
      }
      seq++
    }

    // 表头
    const headers = [
      '序号', '联系人', '申请人', '手机号', '国家', '城市', '套餐',
      '备注/预计出行', '下单时间', '接待客服', '资料收集', '平台进度更新',
      '递交日期', '出签时间', '操作专员', '订单编号', '订单金额', '支付方式',
      '平台扣点', '平台费用', '签证费', '申根保险', '拒签保险',
    ]

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])

    // 设置列宽
    ws['!cols'] = headers.map((_, i) => ({ wch: i === 7 ? 20 : i === 2 ? 12 : 10 }))

    // 多人订单行合并（A-Q列中共享字段的合并）
    const merges: Array<{ s: { r: number; c: number }; e: { r: number; c: number } }> = []
    let mergeStart = 1 // 第0行是表头

    for (let i = 1; i <= rows.length; i++) {
      const cellVal = i < rows.length ? rows[i][0] : Symbol('end')
      if (cellVal !== '' || i === rows.length) {
        if (i - mergeStart > 1) {
          for (let c = 0; c <= 16; c++) {
            merges.push({
              s: { r: mergeStart, c },
              e: { r: i - 1, c },
            })
          }
        }
        mergeStart = i
      }
    }
    if (merges.length > 0) ws['!merges'] = merges

    XLSX.utils.book_append_sheet(wb, ws, '签证统计')

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    const uint8 = new Uint8Array(buf as ArrayBuffer)

    const filename = `签证统计${params.month ?? '导出'}.xlsx`

    return new NextResponse(uint8, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    })
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.statusCode })
    throw error
  }
}
