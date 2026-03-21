import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission } from '@/lib/rbac'
import { autoResolveOrderStatus } from '@/lib/transition'
import { AppError, createSuccessResponse } from '@/types/api'
import { z } from 'zod'

const updateSchema = z.object({
  visaResult: z.enum(['APPROVED', 'REJECTED']).optional(),
  visaResultNote: z.string().max(500).optional(),
  documentsComplete: z.boolean().optional(),
})

/**
 * PATCH /api/applicants/[id]
 *
 * 更新申请人信息（结果/资料状态）
 *
 * 权限：VISA_ADMIN / DOC_COLLECTOR / OPERATOR (orders:transition)
 *
 * 业务逻辑：
 * - 更新 visaResult → 自动调用 autoResolveOrderStatus 判断订单终态
 * - 更新 documentsComplete → 标记资料是否齐全
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

    // 校验至少一个字段
    if (data.visaResult === undefined && data.documentsComplete === undefined) {
      throw new AppError('VALIDATION_ERROR', '请至少提供一个更新字段', 400)
    }

    // 查找申请人（校验 companyId）
    const applicant = await prisma.applicant.findFirst({
      where: { id: params.id, companyId: user.companyId },
      include: {
        order: {
          select: { id: true, companyId: true, orderNo: true, status: true, customerId: true },
        },
      },
    })
    if (!applicant) throw new AppError('NOT_FOUND', '申请人不存在', 404)

    // 事务内更新 + 自动判断终态
    await prisma.$transaction(async (tx) => {
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

      await tx.applicant.update({
        where: { id: params.id },
        data: updateData,
      })

      // 写操作日志
      let actionDetail = ''
      if (data.visaResult !== undefined) {
        actionDetail = `${applicant.name} ${data.visaResult === 'APPROVED' ? '出签' : '拒签'}`
        if (data.visaResultNote) {
          actionDetail += `（${data.visaResultNote}）`
        }
      }
      if (data.documentsComplete !== undefined) {
        actionDetail = `${applicant.name} 资料${data.documentsComplete ? '齐全' : '待补充'}`
      }

      await tx.orderLog.create({
        data: {
          orderId: applicant.order.id,
          companyId: user.companyId,
          userId: user.userId,
          action: actionDetail,
          detail: data.visaResultNote ?? null,
        },
      })

      // 更新出签结果时，自动判断订单终态
      if (data.visaResult !== undefined) {
        const newStatus = await autoResolveOrderStatus(
          tx,
          applicant.order.id,
          user.companyId,
          user.userId
        )

        // 如果订单终态变更，触发通知
        if (newStatus) {
          const statusLabels: Record<string, string> = {
            APPROVED: '全部出签',
            REJECTED: '全部拒签',
            PARTIAL: '部分出签',
          }

          // 通知相关人员
          const notifyUserIds = new Set<string>()
          if (applicant.order.customerId) notifyUserIds.add(applicant.order.customerId)

          if (notifyUserIds.size > 0) {
            await tx.notification.createMany({
              data: Array.from(notifyUserIds).map((uid) => ({
                companyId: user.companyId,
                userId: uid,
                orderId: applicant.order.id,
                type: 'STATUS_CHANGE' as const,
                title: `订单 ${applicant.order.orderNo} ${statusLabels[newStatus] ?? newStatus}`,
                content: `订单已更新为 ${statusLabels[newStatus] ?? newStatus}`,
              })),
            })
          }
        }
      }

      // 更新 documentsComplete 时，通知相关角色
      if (data.documentsComplete !== undefined && data.documentsComplete) {
        // 检查是否所有申请人都资料齐全
        const allApplicants = await tx.applicant.findMany({
          where: { orderId: applicant.order.id },
          select: { documentsComplete: true },
        })
        const allComplete = allApplicants.every((a) => a.documentsComplete)

        if (allComplete) {
          // 所有申请人都资料齐全，可提交审核
          await tx.notification.createMany({
            data: [
              {
                companyId: user.companyId,
                userId: user.userId,
                orderId: applicant.order.id,
                type: 'SYSTEM' as const,
                title: '全部资料齐全',
                content: `订单 ${applicant.order.orderNo} 所有申请人资料已齐全，可以提交审核`,
              },
            ],
          })
        }
      }
    })

    return NextResponse.json(createSuccessResponse({ message: '已更新' }))
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

/**
 * GET /api/applicants/[id]
 *
 * 获取单个申请人详情
 *
 * 权限：orders:read
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'orders', 'read')

    const applicant = await prisma.applicant.findFirst({
      where: { id: params.id, companyId: user.companyId },
      include: {
        order: {
          select: {
            id: true,
            orderNo: true,
            customerName: true,
            targetCountry: true,
            status: true,
            applicantCount: true,
          },
        },
      },
    })

    if (!applicant) throw new AppError('NOT_FOUND', '申请人不存在', 404)

    return NextResponse.json(createSuccessResponse(applicant))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}
