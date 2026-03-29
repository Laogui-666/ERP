import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission, getDataScopeFilter } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import { emitToUser } from '@/lib/socket'
import { z } from 'zod'

// POST /api/templates/apply - 将模板应用到订单（批量创建资料需求）
const applySchema = z.object({
  templateId: z.string().min(1),
  orderId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)
    requirePermission(user, 'documents', 'create')

    const body = await request.json()
    const data = applySchema.parse(body)

    // 查询模板（公司模板或系统模板）
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

    // 查询订单（校验权限）
    const scopeFilter = getDataScopeFilter(user)
    const order = await prisma.order.findFirst({
      where: { id: data.orderId, ...scopeFilter },
      select: { id: true, customerId: true, orderNo: true, status: true },
    })
    if (!order) throw new AppError('NOT_FOUND', '订单不存在', 404)

    // 解析模板 items
    const items = template.items as Array<{ name: string; description?: string; required?: boolean }>

    // 获取当前最大 sortOrder
    const lastReq = await prisma.documentRequirement.findFirst({
      where: { orderId: data.orderId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })
    const baseSort = (lastReq?.sortOrder ?? 0) + 1

    // 事务内批量创建
    const created = await prisma.$transaction(async (tx) => {
      const docs = await tx.documentRequirement.createMany({
        data: items.map((item, i) => ({
          orderId: data.orderId,
          companyId: user.companyId,
          name: item.name,
          description: item.description ?? null,
          isRequired: item.required ?? true,
          sortOrder: baseSort + i,
        })),
      })

      // 如果订单状态是 CONNECTED，自动流转到 COLLECTING_DOCS
      if (order.status === 'CONNECTED') {
        await tx.order.update({
          where: { id: data.orderId },
          data: { status: 'COLLECTING_DOCS' },
        })

        await tx.orderLog.create({
          data: {
            orderId: data.orderId,
            companyId: user.companyId,
            userId: user.userId,
            action: '发送资料清单',
            fromStatus: 'CONNECTED',
            toStatus: 'COLLECTING_DOCS',
            detail: `应用模板「${template.name}」，共 ${items.length} 项`,
          },
        })
      } else {
        await tx.orderLog.create({
          data: {
            orderId: data.orderId,
            companyId: user.companyId,
            userId: user.userId,
            action: '追加资料需求',
            detail: `应用模板「${template.name}」，新增 ${items.length} 项`,
          },
        })
      }

      return docs
    })

    // 通知客户
    if (order.customerId) {
      await prisma.notification.create({
        data: {
          companyId: user.companyId,
          userId: order.customerId,
          orderId: data.orderId,
          type: 'DOC_REVIEWED',
          title: `订单 ${order.orderNo} 资料清单已更新`,
          content: `资料员为您更新了资料清单，共 ${items.length} 项，请及时上传`,
        },
      })
      emitToUser(order.customerId, 'notification', {
        type: 'DOC_REVIEWED',
        title: '资料清单已更新',
        orderId: data.orderId,
        orderNo: order.orderNo,
      })
    }

    return NextResponse.json(createSuccessResponse({ count: created.count }), { status: 201 })
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
