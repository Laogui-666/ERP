import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission, getDataScopeFilter } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import { generateOrderNo, calcPlatformFee, calcGrossProfit } from '@/lib/utils'
import { desensitizeOrderData } from '@/lib/desensitize'
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
  externalOrderNo: z.string().max(50).optional(),
  // M5：多申请人（可选，不传则自动创建1人）
  applicants: z.array(z.object({
    name: z.string().min(1).max(50),
    phone: z.string().regex(/^1[3-9]\d{9}$/).optional(),
    passportNo: z.string().max(20).optional(),
  })).min(1).optional(),
  // M5：流程 & 财务
  contactName: z.string().max(50).optional(),
  targetCity: z.string().max(50).optional(),
  platformFeeRate: z.number().min(0).max(1).optional(),
  visaFee: z.number().min(0).optional(),
  insuranceFee: z.number().min(0).optional(),
  rejectionInsurance: z.number().min(0).optional(),
  reviewBonus: z.number().min(0).optional(),
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
          externalOrderNo: true,
          customerName: true,
          customerPhone: true,
          targetCountry: true,
          visaType: true,
          visaCategory: true,
          status: true,
          amount: true,
          applicantCount: true,
          collectorId: true,
          operatorId: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      prisma.order.count({ where }),
    ])

    // OUTSOURCE 角色脱敏
    const data = user.role === 'OUTSOURCE'
      ? orders.map((o) => desensitizeOrderData(o as Record<string, unknown>, user.role))
      : orders

    return NextResponse.json(createSuccessResponse(data, {
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

    // 生成系统专属订单号: HX + YYYYMMDD + 4位随机码（数据库 unique 约束兜底）
    const orderNo = generateOrderNo()

    // 兼容层：不传 applicants → 自动从 customerName 创建 1 人
    const applicantList = data.applicants ?? [{
      name: data.customerName,
      phone: data.customerPhone,
      passportNo: data.passportNo,
    }]

    // 财务自动计算
    const feeRate = data.platformFeeRate ?? 0.061
    const platformFee = calcPlatformFee(data.amount, feeRate)
    const grossProfit = calcGrossProfit({
      amount: data.amount,
      platformFeeRate: feeRate,
      visaFee: data.visaFee ?? null,
      insuranceFee: data.insuranceFee ?? null,
      rejectionInsurance: data.rejectionInsurance ?? null,
      reviewBonus: data.reviewBonus ?? null,
    })

    const order = await prisma.$transaction(async (tx) => {
      // 检查/创建客户账号
      let customerUser = await tx.user.findFirst({
        where: {
          phone: data.customerPhone,
          companyId: user.companyId,
          role: 'CUSTOMER',
        },
      })

      if (!customerUser) {
        customerUser = await tx.user.create({
          data: {
            companyId: user.companyId,
            username: `c_${user.companyId.slice(0, 8)}_${data.customerPhone}`,
            phone: data.customerPhone,
            email: data.customerEmail ?? null,
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
          customerEmail: data.customerEmail ?? null,
          passportNo: data.passportNo ?? null,
          targetCountry: data.targetCountry,
          visaType: data.visaType,
          visaCategory: data.visaCategory ?? null,
          travelDate: data.travelDate ? new Date(data.travelDate) : null,
          amount: data.amount,
          paymentMethod: data.paymentMethod ?? null,
          sourceChannel: data.sourceChannel ?? null,
          remark: data.remark ?? null,
          customerId: customerUser.id,
          createdBy: user.userId,
          externalOrderNo: data.externalOrderNo ?? null,
          status: 'PENDING_CONNECTION',
          // M5：多申请人 & 财务
          applicantCount: applicantList.length,
          contactName: data.contactName ?? data.customerName,
          targetCity: data.targetCity ?? null,
          platformFeeRate: feeRate,
          platformFee,
          visaFee: data.visaFee ?? null,
          insuranceFee: data.insuranceFee ?? null,
          rejectionInsurance: data.rejectionInsurance ?? null,
          reviewBonus: data.reviewBonus ?? null,
          grossProfit,
        },
      })

      // M4: 创建聊天会话（必须在 order 创建之后立即执行，确保 sendSystemMessage 时 ChatRoom 已存在）
      await tx.chatRoom.upsert({
        where: { orderId: order.id },
        create: {
          companyId: order.companyId,
          orderId: order.id,
          title: `订单 ${order.orderNo}`,
        },
        update: {},
      })

      // 创建 Applicant 记录
      await tx.applicant.createMany({
        data: applicantList.map((a, i) => ({
          orderId: order.id,
          companyId: user.companyId,
          name: a.name,
          phone: a.phone ?? null,
          passportNo: a.passportNo ?? null,
          sortOrder: i,
        })),
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
