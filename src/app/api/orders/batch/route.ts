import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getCurrentUser } from '@shared/lib/auth'
import { requirePermission, getDataScopeFilter } from '@shared/lib/rbac'
import { AppError, createSuccessResponse } from '@shared/types/api'
import { transitionOrder } from '@erp/lib/transition'
import type { OrderStatus } from '@erp/types/order'
import { z } from 'zod'

// POST /api/orders/batch - 批量操作
const batchSchema = z.object({
  action: z.enum(['apply_template', 'transition', 'cancel']),
  orderIds: z.array(z.string().min(1)).min(1).max(50),
  // apply_template 时需要
  templateId: z.string().optional(),
  // transition 时需要
  toStatus: z.string().optional(),
  detail: z.string().optional(),
  // cancel 时需要
  cancelReason: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    const body = await request.json()
    const data = batchSchema.parse(body)

    const scopeFilter = getDataScopeFilter(user)

    if (data.action === 'apply_template') {
      requirePermission(user, 'documents', 'create')
      if (!data.templateId) throw new AppError('VALIDATION_ERROR', '请选择模板', 400)

      // 查询模板
      const template = await prisma.visaTemplate.findFirst({
        where: {
          id: data.templateId,
          OR: [
            { companyId: user.companyId },
            { isSystem: true },
          ],
        },
      })
      if (!template) throw new AppError('NOT_FOUND', '模板不存在', 404)

      const items = template.items as Array<{ name: string; description?: string; required?: boolean }>
      let successCount = 0
      const errors: string[] = []

      for (const orderId of data.orderIds) {
        try {
          const order = await prisma.order.findFirst({
            where: { id: orderId, ...scopeFilter },
            select: { id: true, status: true },
          })
          if (!order) { errors.push(`${orderId}: 订单不存在`); continue }

          const lastReq = await prisma.documentRequirement.findFirst({
            where: { orderId },
            orderBy: { sortOrder: 'desc' },
            select: { sortOrder: true },
          })
          const baseSort = (lastReq?.sortOrder ?? 0) + 1

          await prisma.$transaction(async (tx) => {
            await tx.documentRequirement.createMany({
              data: items.map((item, i) => ({
                orderId,
                companyId: user.companyId,
                name: item.name,
                description: item.description ?? null,
                isRequired: item.required ?? true,
                sortOrder: baseSort + i,
              })),
            })

            if (order.status === 'CONNECTED') {
              await tx.order.update({
                where: { id: orderId },
                data: { status: 'COLLECTING_DOCS' },
              })
              await tx.orderLog.create({
                data: {
                  orderId, companyId: user.companyId, userId: user.userId,
                  action: '批量发送资料清单',
                  fromStatus: 'CONNECTED', toStatus: 'COLLECTING_DOCS',
                  detail: `应用模板「${template.name}」`,
                },
              })
            }
          })
          successCount++
        } catch (err) {
          errors.push(`${orderId}: ${err instanceof Error ? err.message : '未知错误'}`)
        }
      }

      return NextResponse.json(createSuccessResponse({
        successCount,
        failCount: errors.length,
        errors,
      }))
    }

    if (data.action === 'transition') {
      requirePermission(user, 'orders', 'transition')
      if (!data.toStatus) throw new AppError('VALIDATION_ERROR', '请指定目标状态', 400)

      let successCount = 0
      const errors: string[] = []

      for (const orderId of data.orderIds) {
        try {
          await transitionOrder({
            orderId,
            toStatus: data.toStatus as OrderStatus,
            userId: user.userId,
            userRole: user.role,
            companyId: user.companyId,
            detail: data.detail,
          })
          successCount++
        } catch (err) {
          errors.push(`${orderId}: ${err instanceof Error ? err.message : '未知错误'}`)
        }
      }

      return NextResponse.json(createSuccessResponse({
        successCount,
        failCount: errors.length,
        errors,
      }))
    }

    if (data.action === 'cancel') {
      requirePermission(user, 'orders', 'update')
      if (!data.cancelReason) throw new AppError('VALIDATION_ERROR', '请填写取消原因', 400)

      let successCount = 0
      const errors: string[] = []

      for (const orderId of data.orderIds) {
        try {
          const o = await prisma.order.findFirst({
            where: { id: orderId, ...scopeFilter },
            select: { id: true, status: true },
          })
          if (!o) { errors.push(`${orderId}: 订单不存在`); continue }
          if (['APPROVED', 'REJECTED'].includes(o.status)) {
            errors.push(`${orderId}: 已是终态，不可取消`)
            continue
          }

          await prisma.$transaction(async (tx) => {
            await tx.order.update({
              where: { id: orderId },
              data: { status: 'REJECTED', completedAt: new Date() },
            })
            await tx.orderLog.create({
              data: {
                orderId, companyId: user.companyId, userId: user.userId,
                action: '取消订单',
                fromStatus: o.status, toStatus: 'REJECTED',
                detail: data.cancelReason ?? null,
              },
            })
          })
          successCount++
        } catch (err) {
          errors.push(`${orderId}: ${err instanceof Error ? err.message : '未知错误'}`)
        }
      }

      return NextResponse.json(createSuccessResponse({
        successCount,
        failCount: errors.length,
        errors,
      }))
    }

    throw new AppError('INVALID_ACTION', '不支持的操作', 400)
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
