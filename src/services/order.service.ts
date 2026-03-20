import { prisma } from '@/lib/prisma'
import { transitionOrder, getAvailableTransitions } from '@/lib/transition'
import { generateOrderNo } from '@/lib/utils'
import { AppError, DEFAULT_PAGE_SIZE } from '@/types/api'
import type { OrderStatus, OrderQuery, CreateOrderPayload, UpdateOrderPayload } from '@/types/order'
import type { UserRole } from '@/types/user'
import type { JwtPayload } from '@/lib/auth'
import { getDataScopeFilter } from '@/lib/rbac'

export class OrderService {
  async list(query: OrderQuery, user: JwtPayload) {
    const page = query.page ?? 1
    const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, 100)
    const skip = (page - 1) * pageSize

    const where: Record<string, unknown> = {
      ...getDataScopeFilter(user),
    }

    if (query.status) {
      where.status = query.status
    }
    if (query.search) {
      where.OR = [
        { orderNo: { contains: query.search } },
        { customerName: { contains: query.search } },
        { customerPhone: { contains: query.search } },
      ]
    }
    if (query.startDate || query.endDate) {
      const createdAt: Record<string, Date> = {}
      if (query.startDate) createdAt.gte = new Date(query.startDate)
      if (query.endDate) createdAt.lte = new Date(query.endDate)
      where.createdAt = createdAt
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          collector: { select: { id: true, realName: true } },
          operator: { select: { id: true, realName: true } },
        },
      }),
      prisma.order.count({ where }),
    ])

    return {
      data: orders,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  }

  async getById(id: string, user: JwtPayload) {
    const order = await prisma.order.findFirst({
      where: {
        id,
        ...getDataScopeFilter(user),
      },
      include: {
        customer: { select: { id: true, realName: true } },
        collector: { select: { id: true, realName: true } },
        operator: { select: { id: true, realName: true } },
        documentRequirements: {
          orderBy: { sortOrder: 'asc' },
          include: { files: true },
        },
        visaMaterials: true,
        orderLogs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { user: { select: { realName: true } } },
        },
      },
    })

    if (!order) {
      throw new AppError('ORDER_NOT_FOUND', '订单不存在', 404)
    }

    return order
  }

  async create(payload: CreateOrderPayload, user: JwtPayload) {
    const orderNo = generateOrderNo()

    const order = await prisma.order.create({
      data: {
        orderNo,
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        customerEmail: payload.customerEmail ?? null,
        passportNo: payload.passportNo ?? null,
        targetCountry: payload.targetCountry,
        visaType: payload.visaType,
        visaCategory: payload.visaCategory ?? null,
        travelDate: payload.travelDate ? new Date(payload.travelDate) : null,
        amount: payload.amount,
        paymentMethod: payload.paymentMethod ?? null,
        sourceChannel: payload.sourceChannel ?? null,
        remark: payload.remark ?? null,
        companyId: user.companyId,
        createdBy: user.userId,
        externalOrderNo: payload.externalOrderNo ?? null,
        status: 'PENDING_CONNECTION',
      },
    })

    // 写操作日志
    await prisma.orderLog.create({
      data: {
        orderId: order.id,
        userId: user.userId,
        action: '创建订单',
        toStatus: 'PENDING_CONNECTION',
        companyId: user.companyId,
        detail: null,
      },
    })

    return order
  }

  async update(id: string, payload: UpdateOrderPayload, user: JwtPayload) {
    const order = await prisma.order.findFirst({
      where: { id, companyId: user.companyId },
    })

    if (!order) {
      throw new AppError('ORDER_NOT_FOUND', '订单不存在', 404)
    }

    const updateData: Record<string, unknown> = {}
    if (payload.customerName !== undefined) updateData.customerName = payload.customerName
    if (payload.customerPhone !== undefined) updateData.customerPhone = payload.customerPhone
    if (payload.customerEmail !== undefined) updateData.customerEmail = payload.customerEmail ?? null
    if (payload.passportNo !== undefined) updateData.passportNo = payload.passportNo ?? null
    if (payload.targetCountry !== undefined) updateData.targetCountry = payload.targetCountry
    if (payload.visaType !== undefined) updateData.visaType = payload.visaType
    if (payload.visaCategory !== undefined) updateData.visaCategory = payload.visaCategory ?? null
    if (payload.travelDate !== undefined) updateData.travelDate = payload.travelDate ? new Date(payload.travelDate) : null
    if (payload.amount !== undefined) updateData.amount = payload.amount
    if (payload.paymentMethod !== undefined) updateData.paymentMethod = payload.paymentMethod ?? null
    if (payload.sourceChannel !== undefined) updateData.sourceChannel = payload.sourceChannel ?? null
    if (payload.remark !== undefined) updateData.remark = payload.remark ?? null

    return prisma.order.update({
      where: { id },
      data: updateData,
    })
  }

  async changeStatus(orderId: string, toStatus: OrderStatus, user: JwtPayload, detail?: string) {
    await transitionOrder({
      orderId,
      toStatus,
      userId: user.userId,
      userRole: user.role,
      companyId: user.companyId,
      detail,
    })

    return this.getById(orderId, user)
  }

  async claim(orderId: string, user: JwtPayload) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, companyId: user.companyId },
    })

    if (!order) {
      throw new AppError('ORDER_NOT_FOUND', '订单不存在', 404)
    }

    // 统一走状态机 transitionOrder（含事务+日志+事件）
    if (['DOC_COLLECTOR', 'VISA_ADMIN'].includes(user.role)) {
      if (order.status !== 'PENDING_CONNECTION') {
        throw new AppError('INVALID_STATUS', '只有待对接状态的订单可接单', 400)
      }
      await transitionOrder({
        orderId,
        toStatus: 'CONNECTED',
        userId: user.userId,
        userRole: user.role,
        companyId: user.companyId,
        detail: '从公共池接单',
      })
    } else if (['OPERATOR', 'OUTSOURCE'].includes(user.role)) {
      if (order.status !== 'PENDING_REVIEW') {
        throw new AppError('INVALID_STATUS', '只有待审核状态的订单可接单', 400)
      }
      await transitionOrder({
        orderId,
        toStatus: 'UNDER_REVIEW',
        userId: user.userId,
        userRole: user.role,
        companyId: user.companyId,
        detail: '从公共池接单',
      })
    } else {
      throw new AppError('FORBIDDEN', '当前角色无法接单', 403)
    }

    return this.getById(orderId, user)
  }

  async getPool(user: JwtPayload, query: { page?: number; pageSize?: number }) {
    const page = query.page ?? 1
    const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, 100)
    const skip = (page - 1) * pageSize

    // 资料员公共池：PENDING_CONNECTION 且未被接单
    // 操作员公共池：PENDING_REVIEW 且未被接单
    let where: Record<string, unknown>
    if (['DOC_COLLECTOR', 'VISA_ADMIN'].includes(user.role)) {
      where = {
        companyId: user.companyId,
        status: 'PENDING_CONNECTION',
        collectorId: null,
      }
    } else if (['OPERATOR', 'OUTSOURCE'].includes(user.role)) {
      where = {
        companyId: user.companyId,
        status: 'PENDING_REVIEW',
        operatorId: null,
      }
    } else {
      throw new AppError('FORBIDDEN', '当前角色无法查看公共池', 403)
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'asc' },
      }),
      prisma.order.count({ where }),
    ])

    return {
      data: orders,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    }
  }

  getTransitions(currentStatus: OrderStatus, role: UserRole) {
    return getAvailableTransitions(currentStatus, role)
  }
}

export const orderService = new OrderService()
