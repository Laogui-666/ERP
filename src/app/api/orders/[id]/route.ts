import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission, getDataScopeFilter } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import { desensitizeOrderData } from '@/lib/desensitize'
import { calcPlatformFee, calcGrossProfit } from '@/lib/utils'
import { z } from 'zod'

// GET /api/orders/[id] - 订单详情
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
      where: { id: id, ...scopeFilter },
      include: {
        customer: { select: { id: true, realName: true } },
        collector: { select: { id: true, realName: true } },
        operator: { select: { id: true, realName: true } },
        applicants: { orderBy: { sortOrder: 'asc' } },
        documentRequirements: {
          include: { files: true },
          orderBy: { sortOrder: 'asc' },
        },
        visaMaterials: { orderBy: { createdAt: 'desc' } },
        orderLogs: {
          include: { user: { select: { realName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!order) {
      throw new AppError('NOT_FOUND', '订单不存在', 404)
    }

    // OUTSOURCE 角色脱敏
    const data = user.role === 'OUTSOURCE'
      ? desensitizeOrderData(order as unknown as Record<string, unknown>, user.role)
      : order

    return NextResponse.json(createSuccessResponse(data))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}

// PATCH /api/orders/[id] - 更新订单信息（仅允许更新安全字段）
const updateSchema = z.object({
  // 基础字段
  customerName: z.string().min(1).max(50).optional(),
  customerPhone: z.string().regex(/^1[3-9]\d{9}$/).optional(),
  customerEmail: z.string().email().optional(),
  passportNo: z.string().max(20).optional(),
  targetCountry: z.string().min(1).max(50).optional(),
  visaType: z.string().min(1).max(50).optional(),
  visaCategory: z.string().max(50).optional(),
  travelDate: z.string().optional(),
  amount: z.number().positive().max(999999.99).optional(),
  paymentMethod: z.string().max(30).optional(),
  sourceChannel: z.string().max(50).optional(),
  remark: z.string().optional(),
  // M5：多申请人 & 流程
  contactName: z.string().max(50).optional(),
  targetCity: z.string().max(50).optional(),
  submittedAt: z.string().optional(),
  // M5：财务字段
  platformFeeRate: z.number().min(0).max(1).optional(),
  visaFee: z.number().min(0).optional(),
  insuranceFee: z.number().min(0).optional(),
  rejectionInsurance: z.number().min(0).optional(),
  reviewBonus: z.number().min(0).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'orders', 'update')

    const body = await request.json()
    const data = updateSchema.parse(body)

    const scopeFilter = getDataScopeFilter(user)
    const existing = await prisma.order.findFirst({
      where: { id: id, ...scopeFilter },
    })
    if (!existing) throw new AppError('NOT_FOUND', '订单不存在', 404)

    const updateData: Record<string, unknown> = {}
    if (data.customerName !== undefined) updateData.customerName = data.customerName
    if (data.customerPhone !== undefined) updateData.customerPhone = data.customerPhone
    if (data.customerEmail !== undefined) updateData.customerEmail = data.customerEmail ?? null
    if (data.passportNo !== undefined) updateData.passportNo = data.passportNo ?? null
    if (data.targetCountry !== undefined) updateData.targetCountry = data.targetCountry
    if (data.visaType !== undefined) updateData.visaType = data.visaType
    if (data.visaCategory !== undefined) updateData.visaCategory = data.visaCategory ?? null
    if (data.travelDate !== undefined) updateData.travelDate = data.travelDate ? new Date(data.travelDate) : null
    if (data.amount !== undefined) updateData.amount = data.amount
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod ?? null
    if (data.sourceChannel !== undefined) updateData.sourceChannel = data.sourceChannel ?? null
    if (data.remark !== undefined) updateData.remark = data.remark ?? null
    // M5：多申请人 & 流程
    if (data.contactName !== undefined) updateData.contactName = data.contactName ?? null
    if (data.targetCity !== undefined) updateData.targetCity = data.targetCity ?? null
    if (data.submittedAt !== undefined) updateData.submittedAt = data.submittedAt ? new Date(data.submittedAt) : null
    // M5：财务字段 + 自动计算
    let needRecalcProfit = false
    if (data.platformFeeRate !== undefined) { updateData.platformFeeRate = data.platformFeeRate; needRecalcProfit = true }
    if (data.visaFee !== undefined) { updateData.visaFee = data.visaFee; needRecalcProfit = true }
    if (data.insuranceFee !== undefined) { updateData.insuranceFee = data.insuranceFee; needRecalcProfit = true }
    if (data.rejectionInsurance !== undefined) { updateData.rejectionInsurance = data.rejectionInsurance; needRecalcProfit = true }
    if (data.reviewBonus !== undefined) { updateData.reviewBonus = data.reviewBonus; needRecalcProfit = true }
    // 自动重算 platformFee 和 grossProfit
    if (needRecalcProfit) {
      const currentAmount = data.amount ?? existing.amount.toNumber()
      const currentRate = data.platformFeeRate ?? (existing.platformFeeRate?.toNumber() ?? 0.061)
      updateData.platformFee = calcPlatformFee(currentAmount, currentRate)
      updateData.grossProfit = calcGrossProfit({
        amount: currentAmount,
        platformFeeRate: currentRate,
        visaFee: data.visaFee ?? existing.visaFee?.toNumber() ?? null,
        insuranceFee: data.insuranceFee ?? existing.insuranceFee?.toNumber() ?? null,
        rejectionInsurance: data.rejectionInsurance ?? existing.rejectionInsurance?.toNumber() ?? null,
        reviewBonus: data.reviewBonus ?? existing.reviewBonus?.toNumber() ?? null,
      })
    }

    const order = await prisma.order.update({
      where: { id: id },
      data: updateData,
    })

    // 写操作日志
    await prisma.orderLog.create({
      data: {
        orderId: id,
        companyId: user.companyId,
        userId: user.userId,
        action: '更新订单信息',
        fromStatus: null,
        toStatus: null,
        detail: null,
      },
    })

    return NextResponse.json(createSuccessResponse(order))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        new AppError('VALIDATION_ERROR', '参数校验失败', 400, error.errors).toJSON(),
        { status: 400 }
      )
    }
    throw error
  }
}
