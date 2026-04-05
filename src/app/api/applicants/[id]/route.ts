import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getCurrentUser } from '@shared/lib/auth'
import { requirePermission } from '@shared/lib/rbac'
import { AppError, createSuccessResponse } from '@shared/types/api'
import { autoResolveOrderStatus } from '@erp/lib/transition'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  phone: z.string().max(20).optional(),
  passportNo: z.string().max(20).optional(),
  visaResult: z.enum(['APPROVED', 'REJECTED']).optional(),
  visaResultNote: z.string().optional(),
  documentsComplete: z.boolean().optional(),
})

/**
 * PATCH /api/applicants/[id]
 * 更新申请人信息/结果/资料状态
 *
 * 基础信息编辑：需要 orders.update（客服/资料员/管理员均可）
 * 出签结果标记：需要 orders.transition（仅操作员/资料员/管理员）
 * 资料状态标记：需要 orders.transition（仅资料员/管理员）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    const body = await request.json()
    const data = updateSchema.parse(body)

    // 区分操作类型：基础信息编辑 vs 出签/资料操作
    const isBasicInfoEdit = data.name !== undefined || data.phone !== undefined || data.passportNo !== undefined
    const isResultOrDocsEdit = data.visaResult !== undefined || data.documentsComplete !== undefined

    if (isResultOrDocsEdit) {
      // 出签结果和资料状态需要 orders.transition 权限
      requirePermission(user, 'orders', 'transition')
    } else if (isBasicInfoEdit) {
      // 基础信息编辑只需 orders.update 权限
      requirePermission(user, 'orders', 'update')
    } else {
      // 仅更新备注等，也用 orders.update
      requirePermission(user, 'orders', 'update')
    }

    // 查找申请人（校验 companyId）
    const applicant = await prisma.applicant.findFirst({
      where: { id: id, companyId: user.companyId },
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
      if (data.name !== undefined) {
        updateData.name = data.name
      }
      if (data.phone !== undefined) {
        updateData.phone = data.phone || null
      }
      if (data.passportNo !== undefined) {
        updateData.passportNo = data.passportNo || null
      }

      // 更新申请人
      const updated = await tx.applicant.update({
        where: { id: id },
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
