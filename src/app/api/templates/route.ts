import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission, getDataScopeFilter } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import { z } from 'zod'

// GET /api/templates - 模板列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)
    requirePermission(user, 'templates', 'read')

    const scopeFilter = getDataScopeFilter(user)
    const { searchParams } = request.nextUrl
    const country = searchParams.get('country') ?? undefined
    const visaType = searchParams.get('visaType') ?? undefined
    const search = searchParams.get('search') ?? undefined

    const where: Record<string, unknown> = {
      ...scopeFilter,
      ...(country && { country }),
      ...(visaType && { visaType }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { country: { contains: search } },
        ],
      }),
    }

    // 查询公司模板 + 系统预置模板
    const templates = await prisma.visaTemplate.findMany({
      where: {
        OR: [
          where,
          { isSystem: true },
        ],
      },
      orderBy: [
        { isSystem: 'desc' },
        { updatedAt: 'desc' },
      ],
    })

    return NextResponse.json(createSuccessResponse(templates))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}

// POST /api/templates - 创建模板
const createSchema = z.object({
  name: z.string().min(1).max(100),
  country: z.string().min(1).max(50),
  visaType: z.string().min(1).max(50),
  items: z.array(z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    required: z.boolean().default(true),
  })).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)
    requirePermission(user, 'templates', 'create')

    const body = await request.json()
    const data = createSchema.parse(body)

    const template = await prisma.visaTemplate.create({
      data: {
        companyId: user.companyId,
        name: data.name,
        country: data.country,
        visaType: data.visaType,
        items: data.items,
        createdBy: user.userId,
      },
    })

    return NextResponse.json(createSuccessResponse(template), { status: 201 })
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
