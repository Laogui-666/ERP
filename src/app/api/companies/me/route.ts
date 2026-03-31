import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getCurrentUser } from '@shared/lib/auth'
import { requirePermission } from '@shared/lib/rbac'
import { AppError, createSuccessResponse } from '@shared/types/api'
import { z } from 'zod'

// PATCH /api/companies/me - 更新当前公司信息
const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  logo: z.string().optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)
    requirePermission(user, 'departments', 'create') // 只有 COMPANY_OWNER+ 有此权限

    const body = await request.json()
    const data = updateSchema.parse(body)

    if (user.companyId === 'system') {
      throw new AppError('FORBIDDEN', '系统公司不可修改', 403)
    }

    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.phone !== undefined) updateData.phone = data.phone ?? null
    if (data.email !== undefined) updateData.email = data.email ?? null
    if (data.address !== undefined) updateData.address = data.address ?? null
    if (data.logo !== undefined) updateData.logo = data.logo ?? null

    const company = await prisma.company.update({
      where: { id: user.companyId },
      data: updateData,
    })

    return NextResponse.json(createSuccessResponse(company))
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
