import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// GET /api/users - 员工列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'users', 'read')

    const users = await prisma.user.findMany({
      where: { companyId: user.companyId },
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
    })

    return NextResponse.json(createSuccessResponse(users))
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
