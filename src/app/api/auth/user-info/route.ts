import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { AppError, createSuccessResponse } from '@shared/types/api'

// GET /api/auth/user-info?username=xxx — 获取用户基本信息（仅公开字段，用于首次登录重置密码页面预填）
export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get('username')
    if (!username) {
      throw new AppError('VALIDATION_ERROR', '缺少用户名参数', 400)
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        realName: true,
        phone: true,
        role: true,
        status: true,
        passwordHash: true, // 仅用于判断是否首次登录
      },
    })

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('NOT_FOUND', '用户不存在', 404)
    }

    return NextResponse.json(createSuccessResponse({
      username: user.username,
      realName: user.realName,
      phone: user.phone,
      role: user.role,
      isFirstLogin: user.passwordHash === '',
    }))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}
