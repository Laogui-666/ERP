import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission, getDataScopeFilter } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import { z } from 'zod'

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

    // 批量创建
    const created = await prisma.$transaction(
      data.items.map((item, i) =>
        prisma.documentRequirement.create({
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

    // 写操作日志
    await prisma.orderLog.create({
      data: {
        orderId: id,
        companyId: user.companyId,
        userId: user.userId,
        action: '添加资料需求',
        detail: `添加了 ${data.items.length} 项资料需求`,
      },
    })

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
