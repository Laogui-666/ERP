import { prisma } from '@/lib/prisma'
import { transition, getAvailableTransitions } from '@/lib/transition'
import { generateOrderNo } from '@/lib/utils'
import { AppError, DEFAULT_PAGE_SIZE } from '@/types/api'
import type { OrderStatus, Priority, OrderQuery, CreateOrderPayload, UpdateOrderPayload } from '@/types/order'
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
    if (query.priority) {
      where.priority = query.priority
    }
    if (query.assigneeId) {
      where.assigneeId = query.assigneeId
    }
    if (query.search) {
      where.OR = [
        { orderNo: { contains: query.search } },
        { applicantName: { contains: query.search } },
        { applicantPhone: { contains: query.search } },
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
          assignee: { select: { id: true, realName: true } },
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
        assignee: { select: { id: true, realName: true } },
        operator: { select: { id: true, realName: true } },
        documentRequirements: { orderBy: { sortOrder: 'asc' } },
        documentFiles: true,
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
        applicantName: payload.applicantName,
        applicantPhone: payload.applicantPhone ?? null,
        applicantIdCard: payload.applicantIdCard ?? null,
        visaCountry: payload.visaCountry,
        visaType: payload.visaType,
        priority: payload.priority ?? 'NORMAL',
        planDepartDate: payload.planDepartDate ? new Date(payload.planDepartDate) : null,
        deadline: payload.deadline ? new Date(payload.deadline) : null,
        remark: payload.remark ?? null,
        totalPrice: payload.totalPrice ?? null,
        companyId: user.companyId,
      },
    })

    // Write log
    await prisma.orderLog.create({
      data: {
        orderId: order.id,
        userId: user.userId,
        action: '创建订单',
        toStatus: 'PENDING',
        companyId: user.companyId,
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
    if (payload.applicantName !== undefined) updateData.applicantName = payload.applicantName
    if (payload.applicantPhone !== undefined) updateData.applicantPhone = payload.applicantPhone
    if (payload.applicantIdCard !== undefined) updateData.applicantIdCard = payload.applicantIdCard
    if (payload.visaCountry !== undefined) updateData.visaCountry = payload.visaCountry
    if (payload.visaType !== undefined) updateData.visaType = payload.visaType
    if (payload.priority !== undefined) updateData.priority = payload.priority
    if (payload.assigneeId !== undefined) updateData.assigneeId = payload.assigneeId
    if (payload.operatorId !== undefined) updateData.operatorId = payload.operatorId
    if (payload.planDepartDate !== undefined) updateData.planDepartDate = payload.planDepartDate ? new Date(payload.planDepartDate) : null
    if (payload.deadline !== undefined) updateData.deadline = payload.deadline ? new Date(payload.deadline) : null
    if (payload.remark !== undefined) updateData.remark = payload.remark
    if (payload.totalPrice !== undefined) updateData.totalPrice = payload.totalPrice

    return prisma.order.update({
      where: { id },
      data: updateData,
    })
  }

  async changeStatus(orderId: string, toStatus: OrderStatus, user: JwtPayload, remark?: string) {
    await transition({
      orderId,
      toStatus,
      userId: user.userId,
      userRole: user.role,
      companyId: user.companyId,
      remark,
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

    if (order.status !== 'PENDING') {
      throw new AppError('INVALID_STATUS', '只有待分配状态的订单可接单', 400)
    }

    if (order.assigneeId) {
      throw new AppError('ALREADY_ASSIGNED', '该订单已被接单', 400)
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          assigneeId: user.userId,
          status: 'DATA_ENTRY',
        },
      })

      await tx.orderLog.create({
        data: {
          orderId,
          userId: user.userId,
          action: '接单',
          fromStatus: 'PENDING',
          toStatus: 'DATA_ENTRY',
          companyId: user.companyId,
        },
      })
    })

    return this.getById(orderId, user)
  }

  async getPool(user: JwtPayload, query: { page?: number; pageSize?: number }) {
    const page = query.page ?? 1
    const pageSize = Math.min(query.pageSize ?? DEFAULT_PAGE_SIZE, 100)
    const skip = (page - 1) * pageSize

    const where = {
      companyId: user.companyId,
      status: 'PENDING' as OrderStatus,
      assigneeId: null,
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
