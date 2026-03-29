import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import { z } from 'zod'

// GET /api/order-templates — 获取订单模板列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)
    requirePermission(user, 'orders', 'read')

    // 从 VisaTemplate 读取，提取 orderDefaults 字段作为快速录入模板
    const visaTemplates = await prisma.visaTemplate.findMany({
      where: {
        OR: [
          { companyId: user.companyId },
          { isSystem: true },
        ],
      },
      orderBy: { createdAt: 'desc' },
    })

    // 同时查询该公司最近的客户订单（用于老客户快速录入）
    const recentCustomers = await prisma.order.findMany({
      where: {
        companyId: user.companyId,
        customerPhone: { not: '' },
      },
      distinct: ['customerPhone'],
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        customerName: true,
        customerPhone: true,
        customerEmail: true,
        passportNo: true,
        targetCountry: true,
        visaType: true,
        visaCategory: true,
        targetCity: true,
        paymentMethod: true,
        amount: true,
        sourceChannel: true,
        contactName: true,
      },
    })

    return NextResponse.json(createSuccessResponse({
      templates: visaTemplates.map(t => ({
        id: t.id,
        name: t.name,
        country: t.country,
        visaType: t.visaType,
        items: t.items,
        isSystem: t.isSystem,
      })),
      recentCustomers,
    }))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}

// POST /api/order-templates — 快速创建订单（基于模板或老客户信息）
const quickCreateSchema = z.object({
  // 基于模板时传 templateId，基于老客户时传客户信息
  templateId: z.string().optional(),
  // 直接传字段快速创建
  customerName: z.string().min(1).max(50),
  customerPhone: z.string().regex(/^1[3-9]\d{9}$/),
  customerEmail: z.string().email().optional(),
  passportNo: z.string().max(20).optional(),
  targetCountry: z.string().min(1).max(50),
  visaType: z.string().min(1).max(50),
  visaCategory: z.string().max(50).optional(),
  targetCity: z.string().max(50).optional(),
  travelDate: z.string().optional(),
  amount: z.number().positive(),
  paymentMethod: z.string().max(30).optional(),
  sourceChannel: z.string().max(50).optional(),
  remark: z.string().optional(),
  externalOrderNo: z.string().max(50).optional(),
  contactName: z.string().max(50).optional(),
  // 如果传了 templateId，自动将模板的 items 作为资料清单创建
  applyDocTemplate: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)
    requirePermission(user, 'orders', 'create')

    const body = await request.json()
    const data = quickCreateSchema.parse(body)

    // 生成订单号
    const { generateOrderNo } = await import('@/lib/utils')
    const orderNo = generateOrderNo()

    // 查询或创建客户
    let customerId: string | null = null
    const existingCustomer = await prisma.user.findFirst({
      where: {
        companyId: user.companyId,
        phone: data.customerPhone,
        role: 'CUSTOMER',
      },
    })

    if (existingCustomer) {
      customerId = existingCustomer.id
    } else {
      const newCustomer = await prisma.user.create({
        data: {
          companyId: user.companyId,
          username: `c_${data.customerPhone}`,
          phone: data.customerPhone,
          email: data.customerEmail ?? null,
          passwordHash: '', // 空密码，首次登录需重置
          realName: data.customerName,
          role: 'CUSTOMER',
        },
      })
      customerId = newCustomer.id
    }

    // 创建订单
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          companyId: user.companyId,
          orderNo,
          externalOrderNo: data.externalOrderNo ?? null,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail ?? null,
          passportNo: data.passportNo ?? null,
          targetCountry: data.targetCountry,
          visaType: data.visaType,
          visaCategory: data.visaCategory ?? null,
          targetCity: data.targetCity ?? null,
          travelDate: data.travelDate ? new Date(data.travelDate) : null,
          amount: data.amount,
          paymentMethod: data.paymentMethod ?? null,
          sourceChannel: data.sourceChannel ?? null,
          remark: data.remark ?? null,
          contactName: data.contactName ?? data.customerName,
          status: 'PENDING_CONNECTION',
          customerId,
          createdBy: user.userId,
        },
      })

      // 创建申请人（默认1人）
      await tx.applicant.create({
        data: {
          orderId: newOrder.id,
          companyId: user.companyId,
          name: data.customerName,
          phone: data.customerPhone,
          passportNo: data.passportNo ?? null,
        },
      })

      // 创建聊天会话
      await tx.chatRoom.upsert({
        where: { orderId: newOrder.id },
        create: {
          companyId: user.companyId,
          orderId: newOrder.id,
          title: `订单 ${orderNo}`,
        },
        update: {},
      })

      // 如果传了 templateId 且 applyDocTemplate=true，自动应用资料清单模板
      if (data.templateId && data.applyDocTemplate) {
        const template = await tx.visaTemplate.findFirst({
          where: {
            id: data.templateId,
            OR: [
              { companyId: user.companyId },
              { isSystem: true },
            ],
          },
        })

        if (template) {
          const items = template.items as Array<{ name: string; description?: string; required?: boolean }>
          await tx.documentRequirement.createMany({
            data: items.map((item, i) => ({
              orderId: newOrder.id,
              companyId: user.companyId,
              name: item.name,
              description: item.description ?? null,
              isRequired: item.required !== false,
              sortOrder: i,
            })),
          })
        }
      }

      // 操作日志
      await tx.orderLog.create({
        data: {
          orderId: newOrder.id,
          companyId: user.companyId,
          userId: user.userId,
          action: '快速创建订单',
          toStatus: 'PENDING_CONNECTION',
          detail: data.templateId ? '基于模板快速创建' : '快速创建',
        },
      })

      // 通知资料员
      const collectors = await tx.user.findMany({
        where: {
          companyId: user.companyId,
          role: { in: ['DOC_COLLECTOR', 'VISA_ADMIN'] },
          status: 'ACTIVE',
        },
        select: { id: true },
      })

      if (collectors.length > 0) {
        await tx.notification.createMany({
          data: collectors.map(c => ({
            companyId: user.companyId,
            userId: c.id,
            orderId: newOrder.id,
            type: 'ORDER_NEW' as const,
            title: '又有新订单啦',
            content: `订单 ${orderNo} - ${data.customerName} - ${data.targetCountry} ${data.visaType}`,
          })),
        })
      }

      // 通知客户
      if (customerId) {
        await tx.notification.create({
          data: {
            companyId: user.companyId,
            userId: customerId,
            orderId: newOrder.id,
            type: 'ORDER_CREATED',
            title: `订单 ${orderNo} 已创建`,
            content: `您的 ${data.targetCountry} ${data.visaType} 签证订单已创建，资料员将在24小时内联系您`,
          },
        })
      }

      return newOrder
    })

    return NextResponse.json(createSuccessResponse({
      id: order.id,
      orderNo: order.orderNo,
      message: '订单创建成功',
    }), { status: 201 })
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
