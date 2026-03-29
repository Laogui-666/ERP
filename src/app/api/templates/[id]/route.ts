import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import { z } from 'zod'

// GET /api/templates/[id] - 模板详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)
    requirePermission(user, 'templates', 'read')

    const template = await prisma.visaTemplate.findFirst({
      where: {
        id,
        OR: [
          { companyId: user.companyId },
          { isSystem: true },
        ],
      },
    })
    if (!template) throw new AppError('NOT_FOUND', '模板不存在', 404)

    return NextResponse.json(createSuccessResponse(template))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}

// PATCH /api/templates/[id] - 更新模板
const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  country: z.string().min(1).max(50).optional(),
  visaType: z.string().min(1).max(50).optional(),
  items: z.array(z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    required: z.boolean().default(true),
  })).min(1).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)
    requirePermission(user, 'templates', 'update')

    // 不能修改系统模板
    const existing = await prisma.visaTemplate.findFirst({
      where: { id, companyId: user.companyId },
    })
    if (!existing) throw new AppError('NOT_FOUND', '模板不存在', 404)
    if (existing.isSystem) throw new AppError('FORBIDDEN', '系统预置模板不可修改', 403)

    const body = await request.json()
    const data = updateSchema.parse(body)

    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.country !== undefined) updateData.country = data.country
    if (data.visaType !== undefined) updateData.visaType = data.visaType
    if (data.items !== undefined) updateData.items = data.items

    const template = await prisma.visaTemplate.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(createSuccessResponse(template))
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

// DELETE /api/templates/[id] - 删除模板
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)
    requirePermission(user, 'templates', 'delete')

    const existing = await prisma.visaTemplate.findFirst({
      where: { id, companyId: user.companyId },
    })
    if (!existing) throw new AppError('NOT_FOUND', '模板不存在', 404)
    if (existing.isSystem) throw new AppError('FORBIDDEN', '系统预置模板不可删除', 403)

    await prisma.visaTemplate.delete({ where: { id } })

    return NextResponse.json(createSuccessResponse({ message: '已删除' }))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}
