import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission, getDataScopeFilter } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  search: z.string().max(100).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

const createSchema = z.object({
  customerName: z.string().min(1).max(50),
  customerPhone: z.string().regex(/^1[3-9]\d{9}$/),
  customerEmail: z.string().email().optional(),
  passportNo: z.string().max(20).optional(),
  targetCountry: z.string().min(1).max(50),
  visaType: z.string().min(1).max(50),
  visaCategory: z.string().max(50).optional(),
  travelDate: z.string().optional(),
  amount: z.number().positive().max(999999.99),
  paymentMethod: z.string().max(30).optional(),
  sourceChannel: z.string().max(50).optional(),
  remark: z.string().optional(),
})

// GET /api/orders - 订单列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'orders', 'read')

    const params = querySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams)
    )

    const scopeFilter = getDataScopeFilter(user)
    const where: Prisma.OrderWhereInput = {
      ...scopeFilter,
      ...(params.status && { status: params.status as Prisma.EnumOrderStatusFilter }),
      ...(params.search && {
        OR: [
          { orderNo: { contains: params.search } },
          { customerName: { contains: params.search } },
        ],
      }),
      ...(params.startDate && {
        createdAt: { gte: new Date(params.startDate) },
      }),
      ...(params.endDate && {
        createdAt: { lte: new Date(params.endDate) },
      }),
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNo: true,
          customerName: true,
          customerPhone: true,
          targetCountry: true,
          visaType: true,
          status: true,
          amount: true,
          collectorId: true,
          operatorId: true,
          createdAt: true,
          updatedAt: true,
          collector: { select: { id: true, realName: true } },
          operator: { select: { id: true, realName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json(createSuccessResponse(orders, {
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(total / params.pageSize),
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

// POST /api/orders - 创建订单（客服录单）
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'orders', 'create')

    const body = await request.json()
    const data = createSchema.parse(body)

    // 生成订单号: V + YYYYMMDD + 3位序号
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const count = await prisma.order.count({
      where: {
        orderNo: { startsWith: `V${today}` },
        companyId: user.companyId,
      },
    })
    const orderNo = `V${today}${String(count + 1).padStart(3, '0')}`

    const order = await prisma.$transaction(async (tx) => {
      // 检查/创建客户账号
      let customerUser = await tx.user.findFirst({
        where: {
          phone: data.customerPhone,
          companyId: user.companyId,
        },
      })

      if (!customerUser) {
        customerUser = await tx.user.create({
          data: {
            companyId: user.companyId,
            username: `c_${data.customerPhone}`,
            phone: data.customerPhone,
            email: data.customerEmail,
            passwordHash: '', // 客户首次登录需重置
            realName: data.customerName,
            role: 'CUSTOMER',
          },
        })
      }

      const order = await tx.order.create({
        data: {
          companyId: user.companyId,
          orderNo,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail,
          passportNo: data.passportNo,
          targetCountry: data.targetCountry,
          visaType: data.visaType,
          visaCategory: data.visaCategory,
          travelDate: data.travelDate ? new Date(data.travelDate) : undefined,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          sourceChannel: data.sourceChannel,
          remark: data.remark,
          customerId: customerUser.id,
          status: 'PENDING_CONNECTION',
        },
      })

      // 写操作日志
      await tx.orderLog.create({
        data: {
          orderId: order.id,
          companyId: user.companyId,
          userId: user.userId,
          action: '创建订单',
          fromStatus: null,
          toStatus: 'PENDING_CONNECTION',
          detail: `客服 ${user.username} 创建订单 ${orderNo}`,
        },
      })

      // 通知所有资料员
      const collectors = await tx.user.findMany({
        where: {
          companyId: user.companyId,
          role: { in: ['DOC_COLLECTOR', 'VISA_ADMIN'] },
          status: 'ACTIVE',
        },
      })

      await tx.notification.createMany({
        data: collectors.map((c) => ({
          companyId: user.companyId,
          userId: c.id,
          orderId: order.id,
          type: 'ORDER_NEW',
          title: '又有新订单啦',
          content: `新订单 ${orderNo} - ${data.customerName} (${data.targetCountry} ${data.visaType})`,
        })),
      })

      // 通知客户
      await tx.notification.create({
        data: {
          companyId: user.companyId,
          userId: customerUser.id,
          orderId: order.id,
          type: 'ORDER_CREATED',
          title: '订单已创建',
          content: `您的签证订单 ${orderNo} 已创建，资料员将在24小时内与您联系`,
        },
      })

      return order
    })

    return NextResponse.json(createSuccessResponse(order), { status: 201 })
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
