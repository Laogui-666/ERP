import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getCurrentUser } from '@shared/lib/auth'
import { createSuccessResponse } from '@shared/types/api'
import { z } from 'zod'

// GET /api/form-templates - 申请表模板列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: '未登录' } }, { status: 401 })

    const { searchParams } = request.nextUrl
    const country = searchParams.get('country') || undefined
    const visaType = searchParams.get('visaType') || undefined

    const where: Record<string, unknown> = {}
    if (country) where.country = country
    if (visaType) where.visaType = visaType

    const templates = await prisma.formTemplate.findMany({
      where,
      orderBy: [{ isSystem: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(createSuccessResponse(templates))
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } }, { status: 500 })
  }
}

// POST /api/form-templates - 创建模板（管理员）
const createSchema = z.object({
  country: z.string().min(1).max(50),
  visaType: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  fields: z.array(z.object({
    label: z.string(),
    key: z.string(),
    type: z.enum(['text', 'number', 'date', 'select', 'textarea', 'checkbox']),
    required: z.boolean(),
    hint: z.string().optional(),
    example: z.string().optional(),
    options: z.array(z.string()).optional(),
  })),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: '未登录' } }, { status: 401 })
    if (!['SUPER_ADMIN', 'COMPANY_OWNER', 'VISA_ADMIN'].includes(user.role)) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: '无权操作' } }, { status: 403 })
    }

    const body = createSchema.parse(await request.json())
    const template = await prisma.formTemplate.create({
      data: {
        country: body.country,
        visaType: body.visaType,
        name: body.name,
        fields: body.fields,
      },
    })

    return NextResponse.json(createSuccessResponse(template), { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: '参数错误', details: error.errors } }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } }, { status: 500 })
  }
}
