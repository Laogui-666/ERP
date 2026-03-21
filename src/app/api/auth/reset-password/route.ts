import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signAccessToken, signRefreshToken, setAuthCookies } from '@/lib/auth'
import { AppError, createSuccessResponse } from '@/types/api'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const resetSchema = z.object({
  username: z.string().min(1),
  phone: z.string().regex(/^1[3-9]\d{9}$/),
  newPassword: z.string().min(8).max(50),
})

// POST /api/auth/reset-password - 客户首次登录重置密码
// 验证手机号 + 用户名后设置新密码并自动登录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, phone, newPassword } = resetSchema.parse(body)

    const user = await prisma.user.findFirst({
      where: {
        username,
        phone,
        role: 'CUSTOMER',
      },
      include: { company: true },
    })

    if (!user) {
      throw new AppError('NOT_FOUND', '未找到匹配的客户账号', 404)
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError('ACCOUNT_LOCKED', '账号已被禁用', 403)
    }

    // 仅允许空密码（首次登录）的客户重置
    if (user.passwordHash !== '') {
      throw new AppError('ALREADY_SET', '密码已设置，请直接登录', 400)
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        lastLoginAt: new Date(),
      },
    })

    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      companyId: user.companyId,
      departmentId: user.departmentId,
    }

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(payload),
      signRefreshToken(payload),
    ])

    await setAuthCookies(accessToken, refreshToken)

    return NextResponse.json(createSuccessResponse({
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        company: { id: user.company.id, name: user.company.name },
        avatar: user.avatar,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
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
