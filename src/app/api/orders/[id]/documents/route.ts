import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission, getDataScopeFilter } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import { emitToUser } from '@/lib/socket'
import { z } from 'zod'
import type { OrderStatus } from '@/types/order'

// GET /api/orders/[id]/documents - 获取订单资料清单
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'documents', 'read')

    const scopeFilter = getDataScopeFilter(user)
    const order = await prisma.order.findFirst({
      where: { id: id, ...scopeFilter },
    })
    if (!order) throw new AppError('NOT_FOUND', '订单不存在', 404)

    const requirements = await prisma.documentRequirement.findMany({
      where: { orderId: id },
      include: {
        files: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(createSuccessResponse(requirements))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}

// POST /api/orders/[id]/documents - 添加资料需求项
const addRequirementSchema = z.object({
  items: z.array(z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    isRequired: z.boolean().default(true),
  })).min(1),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'documents', 'create')

    const body = await request.json()
    const data = addRequirementSchema.parse(body)

    const scopeFilter = getDataScopeFilter(user)
    const order = await prisma.order.findFirst({
      where: { id: id, ...scopeFilter },
    })
    if (!order) throw new AppError('NOT_FOUND', '订单不存在', 404)

    // 获取当前最大排序号
    const lastReq = await prisma.documentRequirement.findFirst({
      where: { orderId: id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })
    let nextSort = (lastReq?.sortOrder ?? 0) + 1

    // 批量创建（含自动状态流转）
    const created = await prisma.$transaction(async (tx) => {
      // 创建资料需求项
      const items = await Promise.all(
        data.items.map((item, i) =>
          tx.documentRequirement.create({
            data: {
              orderId: id,
              companyId: user.companyId,
              name: item.name,
              description: item.description ?? null,
              isRequired: item.isRequired,
              sortOrder: nextSort + i,
            },
          })
        )
      )

      // GAP-1 修复：CONNECTED → COLLECTING_DOCS 自动流转
      // 资料员首次发送资料清单时，自动进入资料收集阶段
      if (order.status === 'CONNECTED') {
        await tx.order.update({
          where: { id },
          data: { status: 'COLLECTING_DOCS' as OrderStatus },
        })
        await tx.orderLog.create({
          data: {
            orderId: id,
            companyId: user.companyId,
            userId: user.userId,
            action: '发送资料清单',
            fromStatus: 'CONNECTED',
            toStatus: 'COLLECTING_DOCS',
            detail: `发送了 ${data.items.length} 项资料需求给客户`,
          },
        })
      } else {
        // 非首次（追加资料）：普通操作日志
        await tx.orderLog.create({
          data: {
            orderId: id,
            companyId: user.companyId,
            userId: user.userId,
            action: '添加资料需求',
            detail: `添加了 ${data.items.length} 项资料需求`,
          },
        })
      }

      return items
    })

    // 通知客户：资料清单已更新
    const orderWithCustomer = await prisma.order.findUnique({
      where: { id },
      select: { customerId: true, collectorId: true, orderNo: true, status: true },
    })
    if (orderWithCustomer?.customerId) {
      const isFirstSend = order.status === 'CONNECTED'
      await prisma.notification.create({
        data: {
          companyId: user.companyId,
          userId: orderWithCustomer.customerId,
          orderId: id,
          type: 'DOC_REVIEWED',
          title: `订单 ${orderWithCustomer.orderNo} ${isFirstSend ? '资料清单已发送' : '资料清单已更新'}`,
          content: `资料员为您${isFirstSend ? '发送' : '新增'}了 ${data.items.length} 项资料需求，请及时上传`,
        },
      })

      emitToUser(orderWithCustomer.customerId, 'notification', {
        type: 'DOC_REVIEWED',
        title: isFirstSend ? '资料清单已发送' : '资料清单已更新',
        orderId: id,
        orderNo: orderWithCustomer.orderNo,
      })
    }

    // GAP-2 修复：操作员在 UNDER_REVIEW 阶段添加补充资料时通知资料员
    if (['UNDER_REVIEW', 'MAKING_MATERIALS'].includes(order.status) && order.collectorId) {
      const names = data.items.map(i => i.name).join('、')
      await prisma.notification.create({
        data: {
          companyId: user.companyId,
          userId: order.collectorId,
          orderId: id,
          type: 'DOC_REVIEWED',
          title: `订单 ${orderWithCustomer?.orderNo ?? ''} 新增补充资料`,
          content: `操作员新增了 ${data.items.length} 项补充资料需求：${names}，请通知客户上传`,
        },
      })
      emitToUser(order.collectorId, 'notification', {
        type: 'DOC_REVIEWED',
        title: '新增补充资料',
        orderId: id,
        orderNo: orderWithCustomer?.orderNo,
      })
    }

    return NextResponse.json(createSuccessResponse(created), { status: 201 })
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
