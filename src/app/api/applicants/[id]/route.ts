import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import { autoResolveOrderStatus } from '@/lib/transition'
import { z } from 'zod'

const updateSchema = z.object({
  visaResult: z.enum(['APPROVED', 'REJECTED']).optional(),
  visaResultNote: z.string().optional(),
  documentsComplete: z.boolean().optional(),
})

/**
 * PATCH /api/applicants/[id]
 * 更新申请人结果/资料状态
 *
 * 权限：VISA_ADMIN / DOC_COLLECTOR / OPERATOR
 *
 * 更新 visaResult 后自动调用 autoResolveOrderStatus 判断订单终态：
 * - 全部出签 → APPROVED
 * - 全部拒签 → REJECTED
 * - 混合结果 → PARTIAL
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'orders', 'transition')

    const body = await request.json()
    const data = updateSchema.parse(body)

    // 查找申请人（校验 companyId）
    const applicant = await prisma.applicant.findFirst({
      where: { id: params.id, companyId: user.companyId },
      include: {
        order: {
          select: {
            id: true,
            companyId: true,
            status: true,
            orderNo: true,
            collectorId: true,
            operatorId: true,
            customerId: true,
          },
        },
      },
    })
    if (!applicant) throw new AppError('NOT_FOUND', '申请人不存在', 404)

    // 事务内更新 + 自动判断终态
    const result = await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {}

      if (data.visaResult !== undefined) {
        updateData.visaResult = data.visaResult
        updateData.visaResultAt = new Date()
      }
      if (data.visaResultNote !== undefined) {
        updateData.visaResultNote = data.visaResultNote ?? null
      }
      if (data.documentsComplete !== undefined) {
        updateData.documentsComplete = data.documentsComplete
      }

      // 更新申请人
      const updated = await tx.applicant.update({
        where: { id: params.id },
        data: updateData,
      })

      // 写操作日志
      let actionDesc = ''
      if (data.visaResult) {
        actionDesc = `${applicant.name} ${data.visaResult === 'APPROVED' ? '出签' : '拒签'}`
      } else if (data.documentsComplete !== undefined) {
        actionDesc = `${applicant.name} 资料${data.documentsComplete ? '齐全' : '待补充'}`
      }

      await tx.orderLog.create({
        data: {
          orderId: applicant.order.id,
          companyId: user.companyId,
          userId: user.userId,
          action: actionDesc || '更新申请人信息',
          detail: data.visaResultNote ?? null,
        },
      })

      // 如果更新了出签结果，自动判断订单终态
      let newOrderStatus = null
      if (data.visaResult !== undefined) {
        const resolveResult = await autoResolveOrderStatus(
          tx,
          applicant.order.id,
          user.companyId,
          user.userId
        )
        newOrderStatus = resolveResult
      }

      return { updated, newOrderStatus }
    })

    // 如果订单状态变更，通知相关人员
    if (result.newOrderStatus) {
      const order = applicant.order
      const notifyUserIds = new Set<string>()
      if (order.collectorId && order.collectorId !== user.userId) notifyUserIds.add(order.collectorId)
      if (order.operatorId && order.operatorId !== user.userId) notifyUserIds.add(order.operatorId)
      if (order.customerId && order.customerId !== user.userId) notifyUserIds.add(order.customerId)

      if (notifyUserIds.size > 0) {
        await prisma.notification.createMany({
          data: Array.from(notifyUserIds).map((uid) => ({
            companyId: user.companyId,
            userId: uid,
            orderId: order.id,
            type: 'STATUS_CHANGE' as const,
            title: `订单 ${order.orderNo} 出签结果更新`,
            content: `${applicant.name} 的出签结果已更新，订单状态变更为 ${result.newOrderStatus}`,
          })),
        })
      }
    }

    return NextResponse.json(createSuccessResponse({
      applicant: result.updated,
      orderStatus: result.newOrderStatus,
    }))
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
