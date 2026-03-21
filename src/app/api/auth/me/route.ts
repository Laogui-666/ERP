import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AppError, createSuccessResponse } from '@/types/api'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      throw new AppError('UNAUTHORIZED', '未登录', 401)
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        company: { select: { id: true, name: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    })

    if (!profile) {
      throw new AppError('NOT_FOUND', '用户不存在', 404)
    }

    return NextResponse.json(createSuccessResponse({
      id: profile.id,
      username: profile.username,
      realName: profile.realName,
      phone: profile.phone,
      email: profile.email,
      role: profile.role,
      companyId: profile.companyId,
      company: profile.company,
      department: profile.department,
      avatar: profile.avatar,
      status: profile.status,
      lastLoginAt: profile.lastLoginAt,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    }))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}
