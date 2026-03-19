import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission, getDataScopeFilter } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import { z } from 'zod'

// GET /api/orders/[id] - 订单详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'orders', 'read')

    const scopeFilter = getDataScopeFilter(user)
    const order = await prisma.order.findFirst({
      where: { id: params.id, ...scopeFilter },
      include: {
        customer: { select: { id: true, realName: true } },
        collector: { select: { id: true, realName: true } },
        operator: { select: { id: true, realName: true } },
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

    return NextResponse.json(createSuccessResponse(order))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}

// PATCH /api/orders/[id] - 更新订单信息（仅允许更新安全字段）
const updateSchema = z.object({
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
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'orders', 'update')

    const body = await request.json()
    const data = updateSchema.parse(body)

    const scopeFilter = getDataScopeFilter(user)
    const existing = await prisma.order.findFirst({
      where: { id: params.id, ...scopeFilter },
    })
    if (!existing) throw new AppError('NOT_FOUND', '订单不存在', 404)

    const updateData: Record<string, unknown> = {}
    if (data.customerName !== undefined) updateData.customerName = data.customerName
    if (data.customerPhone !== undefined) updateData.customerPhone = data.customerPhone
    if (data.customerEmail !== undefined) updateData.customerEmail = data.customerEmail
    if (data.passportNo !== undefined) updateData.passportNo = data.passportNo
    if (data.targetCountry !== undefined) updateData.targetCountry = data.targetCountry
    if (data.visaType !== undefined) updateData.visaType = data.visaType
    if (data.visaCategory !== undefined) updateData.visaCategory = data.visaCategory ?? null
    if (data.travelDate !== undefined) updateData.travelDate = data.travelDate ? new Date(data.travelDate) : null
    if (data.amount !== undefined) updateData.amount = data.amount
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod ?? null
    if (data.sourceChannel !== undefined) updateData.sourceChannel = data.sourceChannel ?? null
    if (data.remark !== undefined) updateData.remark = data.remark ?? null

    const order = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
    })

    // 写操作日志
    await prisma.orderLog.create({
      data: {
        orderId: params.id,
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
