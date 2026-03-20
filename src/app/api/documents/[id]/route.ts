import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import { z } from 'zod'
import type { DocReqStatus } from '@/types/order'

// PATCH /api/documents/[id] - 更新资料需求状态（审核）
const updateSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'SUPPLEMENT']),
  rejectReason: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'documents', 'update')

    const body = await request.json()
    const data = updateSchema.parse(body)

    // 查找资料需求
    const requirement = await prisma.documentRequirement.findFirst({
      where: { id: params.id, companyId: user.companyId },
      include: { order: { select: { id: true, orderNo: true } } },
    })
    if (!requirement) throw new AppError('NOT_FOUND', '资料需求不存在', 404)

    // 更新状态
    const updated = await prisma.documentRequirement.update({
      where: { id: params.id },
      data: {
        status: data.status,
        rejectReason: data.status === 'REJECTED' || data.status === 'SUPPLEMENT'
          ? (data.rejectReason ?? null)
          : null,
      },
    })

    // 写操作日志
    const statusLabels: Record<DocReqStatus, string> = {
      PENDING: '待上传',
      UPLOADED: '已上传',
      REVIEWING: '审核中',
      APPROVED: '已合格',
      REJECTED: '需修改',
      SUPPLEMENT: '需补充',
    }
    await prisma.orderLog.create({
      data: {
        orderId: requirement.orderId,
        companyId: user.companyId,
        userId: user.userId,
        action: `审核资料: ${requirement.name}`,
        detail: `状态变更为 ${statusLabels[data.status]}${data.rejectReason ? `，原因: ${data.rejectReason}` : ''}`,
      },
    })

    // 通知客户（如果被驳回）
    if (data.status === 'REJECTED' || data.status === 'SUPPLEMENT') {
      const order = await prisma.order.findUnique({
        where: { id: requirement.orderId },
        select: { customerId: true },
      })
      if (order?.customerId) {
        await prisma.notification.create({
          data: {
            companyId: user.companyId,
            userId: order.customerId,
            orderId: requirement.orderId,
            type: 'DOC_REVIEWED',
            title: '资料审核结果',
            content: `您的资料"${requirement.name}"${data.status === 'REJECTED' ? '需要修改' : '需要补充'}${data.rejectReason ? `：${data.rejectReason}` : ''}`,
          },
        })
      }
    }

    return NextResponse.json(createSuccessResponse(updated))
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

// DELETE /api/documents/[id] - 删除资料需求
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'documents', 'delete')

    const requirement = await prisma.documentRequirement.findFirst({
      where: { id: params.id, companyId: user.companyId },
    })
    if (!requirement) throw new AppError('NOT_FOUND', '资料需求不存在', 404)

    // 级联删除文件记录（数据库已设置 onDelete: Cascade）
    await prisma.documentRequirement.delete({
      where: { id: params.id },
    })

    return NextResponse.json(createSuccessResponse({ message: '已删除' }))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}
