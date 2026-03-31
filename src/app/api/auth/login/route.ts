import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { signAccessToken, signRefreshToken, setAuthCookies } from '@shared/lib/auth'
import { AppError, createSuccessResponse } from '@shared/types/api'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = loginSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { username },
      include: { company: true },
    })

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('AUTH_FAILED', '用户名或密码错误', 401)
    }

    // 客户首次登录：密码为空，需重置
    if (user.passwordHash === '') {
      throw new AppError('RESET_REQUIRED', '首次登录请先设置密码', 403)
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      throw new AppError('AUTH_FAILED', '用户名或密码错误', 401)
    }

    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      companyId: user.companyId,
      departmentId: user.departmentId,
      realName: user.realName,
      avatar: user.avatar,
    }

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(payload),
      signRefreshToken(payload),
    ])

    await setAuthCookies(accessToken, refreshToken)

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return NextResponse.json(createSuccessResponse({
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        departmentId: user.departmentId,
        company: { id: user.company.id, name: user.company.name },
        avatar: user.avatar,
        status: user.status,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    }))
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
