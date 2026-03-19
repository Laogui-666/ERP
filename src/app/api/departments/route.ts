import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import { z } from 'zod'

// GET /api/departments - 部门列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'departments', 'read')

    const departments = await prisma.department.findMany({
      where: { companyId: user.companyId },
      include: {
        _count: { select: { users: true } },
        children: true,
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(createSuccessResponse(departments))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}

// POST /api/departments - 创建部门
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'departments', 'create')

    const body = await request.json()
    const schema = z.object({
      name: z.string().min(1).max(50),
      code: z.string().min(1).max(30),
      parentId: z.string().optional(),
      sortOrder: z.number().optional(),
    })

    const data = schema.parse(body)

    const dept = await prisma.department.create({
      data: {
        companyId: user.companyId,
        name: data.name,
        code: data.code,
        parentId: data.parentId ?? null,
        sortOrder: data.sortOrder ?? 0,
      },
    })

    return NextResponse.json(createSuccessResponse(dept), { status: 201 })
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
