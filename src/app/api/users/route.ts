import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getCurrentUser } from '@shared/lib/auth'
import { requirePermission } from '@shared/lib/rbac'
import { AppError, createSuccessResponse } from '@shared/types/api'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// GET /api/users - 员工列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'users', 'read')

    const params = z.object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(50),
      role: z.string().optional(),
      search: z.string().max(50).optional(),
    }).parse(Object.fromEntries(request.nextUrl.searchParams))

    const where: Record<string, unknown> = { companyId: user.companyId }
    if (params.role) where.role = params.role
    if (params.search) {
      where.OR = [
        { realName: { contains: params.search } },
        { username: { contains: params.search } },
        { phone: { contains: params.search } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          realName: true,
          phone: true,
          email: true,
          role: true,
          status: true,
          departmentId: true,
          department: { select: { id: true, name: true, code: true } },
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json(createSuccessResponse(users, {
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(total / params.pageSize),
    }))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}

// POST /api/users - 创建员工
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'users', 'create')

    const body = await request.json()
    const schema = z.object({
      username: z.string().min(3).max(50),
      password: z.string().min(8),
      realName: z.string().min(1).max(50),
      phone: z.string().regex(/^1[3-9]\d{9}$/),
      email: z.string().email().optional(),
      role: z.enum([
        'COMPANY_OWNER', 'CS_ADMIN', 'CUSTOMER_SERVICE',
        'VISA_ADMIN', 'DOC_COLLECTOR', 'OPERATOR', 'OUTSOURCE', 'CUSTOMER',
      ]),
      departmentId: z.string().optional(),
    })

    const data = schema.parse(body)

    const existing = await prisma.user.findUnique({ where: { username: data.username } })
    if (existing) throw new AppError('DUPLICATE', '用户名已存在', 409)

    const passwordHash = await bcrypt.hash(data.password, 12)

    const newUser = await prisma.user.create({
      data: {
        companyId: user.companyId,
        username: data.username,
        passwordHash,
        realName: data.realName,
        phone: data.phone,
        email: data.email ?? null,
        role: data.role,
        departmentId: data.departmentId ?? null,
      },
    })

    return NextResponse.json(createSuccessResponse({
      id: newUser.id,
      username: newUser.username,
      realName: newUser.realName,
      role: newUser.role,
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
