import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission, getDataScopeFilter } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'

// GET /api/orders/[id]/check - 智能资料检查
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)
    requirePermission(user, 'orders', 'read')

    const scopeFilter = getDataScopeFilter(user)
    const order = await prisma.order.findFirst({
      where: { id, ...scopeFilter },
      include: {
        documentRequirements: {
          include: { files: true },
          orderBy: { sortOrder: 'asc' },
        },
        applicants: { orderBy: { sortOrder: 'asc' } },
      },
    })
    if (!order) throw new AppError('NOT_FOUND', '订单不存在', 404)

    const warnings: Array<{ level: 'error' | 'warning' | 'info'; message: string; field?: string }> = []

    // 1. 护照有效期检查
    if (order.passportExpiry && order.travelDate) {
      const passportExpiry = new Date(order.passportExpiry)
      const travelDate = new Date(order.travelDate)
      const sixMonthsLater = new Date(travelDate)
      sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6)

      if (passportExpiry < sixMonthsLater) {
        const daysUntilExpiry = Math.floor((passportExpiry.getTime() - travelDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysUntilExpiry < 0) {
          warnings.push({ level: 'error', message: '护照已过期！出行日期超过护照有效期', field: 'passportExpiry' })
        } else if (daysUntilExpiry < 90) {
          warnings.push({ level: 'error', message: `护照有效期不足3个月（仅剩${daysUntilExpiry}天），多数国家要求6个月以上`, field: 'passportExpiry' })
        } else {
          warnings.push({ level: 'warning', message: `护照有效期不足6个月（剩余${daysUntilExpiry}天），部分国家可能拒绝`, field: 'passportExpiry' })
        }
      }
    }

    // 2. 资料齐全性检查
    const totalRequired = order.documentRequirements.filter(r => r.isRequired).length
    const approvedRequired = order.documentRequirements.filter(r => r.isRequired && r.status === 'APPROVED').length
    const rejectedCount = order.documentRequirements.filter(r => r.status === 'REJECTED' || r.status === 'SUPPLEMENT').length

    if (rejectedCount > 0) {
      warnings.push({ level: 'warning', message: `有 ${rejectedCount} 项资料需要修改或补充` })
    }

    if (totalRequired > 0 && approvedRequired < totalRequired) {
      warnings.push({ level: 'info', message: `必填资料 ${approvedRequired}/${totalRequired} 已合格` })
    }

    // 3. 多申请人资料完整性
    if (order.applicantCount > 1) {
      const incompleteApplicants = order.applicants.filter(a => !a.documentsComplete)
      if (incompleteApplicants.length > 0) {
        warnings.push({
          level: 'info',
          message: `${incompleteApplicants.length} 位申请人资料未齐全：${incompleteApplicants.map(a => a.name).join('、')}`,
        })
      }
    }

    // 4. 根据签证类型推荐缺失资料
    const commonDocs: Record<string, string[]> = {
      '旅游': ['护照', '照片', '在职证明', '银行流水', '行程单', '酒店预订单', '旅行保险'],
      '商务': ['护照', '照片', '邀请函', '在职证明', '公司营业执照'],
      '留学': ['护照', '照片', '录取通知书', '资金证明', '学历证明'],
    }
    const recommendedDocs = commonDocs[order.visaType] ?? commonDocs['旅游']
    const existingNames = order.documentRequirements.map(r => r.name)
    const missingDocs = recommendedDocs.filter(d => !existingNames.some(e => e.includes(d)))
    if (missingDocs.length > 0) {
      warnings.push({
        level: 'info',
        message: `建议补充：${missingDocs.join('、')}`,
      })
    }

    // 5. 财务异常检查
    if (order.grossProfit !== null) {
      const profit = order.grossProfit.toNumber()
      if (profit < 0) {
        warnings.push({ level: 'warning', message: `毛利为负（¥${profit.toFixed(2)}），请检查财务数据` })
      }
    }

    return NextResponse.json(createSuccessResponse({
      orderId: order.id,
      orderNo: order.orderNo,
      warnings,
      summary: {
        totalRequirements: order.documentRequirements.length,
        approvedRequired,
        totalRequired,
        rejectedCount,
        applicantCount: order.applicantCount,
        incompleteApplicants: order.applicants.filter(a => !a.documentsComplete).length,
      },
    }))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}
