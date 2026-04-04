import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getCurrentUser } from '@shared/lib/auth'
import { requirePermission } from '@shared/lib/rbac'
import { AppError, createSuccessResponse } from '@shared/types/api'
import { z } from 'zod'

const createSchema = z.object({
  orderId: z.string().min(1),
  name: z.string().min(1).max(50),
  phone: z.string().max(20).optional(),
  passportNo: z.string().max(20).optional(),
})

/**
 * POST /api/applicants
 * 为已有订单添加申请人
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'orders', 'update')

    const body = await request.json()
    const data = createSchema.parse(body)

    // 校验订单存在且属于本公司
    const order = await prisma.order.findFirst({
      where: { id: data.orderId, companyId: user.companyId },
      select: { id: true, applicantCount: true, status: true },
    })
    if (!order) throw new AppError('NOT_FOUND', '订单不存在', 404)

    if (['APPROVED', 'REJECTED', 'PARTIAL'].includes(order.status)) {
      throw new AppError('INVALID_STATUS', '终态订单不能添加申请人', 400)
    }

    // 获取当前最大 sortOrder
    const maxOrder = await prisma.applicant.findFirst({
      where: { orderId: data.orderId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const applicant = await prisma.$transaction(async (tx) => {
      const newApplicant = await tx.applicant.create({
        data: {
          orderId: data.orderId,
          companyId: user.companyId,
          name: data.name,
          phone: data.phone || null,
          passportNo: data.passportNo || null,
          sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
        },
      })

      // 更新订单申请人数量
      await tx.order.update({
        where: { id: data.orderId },
        data: { applicantCount: { increment: 1 } },
      })

      // 写操作日志
      await tx.orderLog.create({
        data: {
          orderId: data.orderId,
          companyId: user.companyId,
          userId: user.userId,
          action: '添加申请人',
          detail: `添加申请人：${data.name}`,
        },
      })

      return newApplicant
    })

    return NextResponse.json(createSuccessResponse(applicant), { status: 201 })
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
