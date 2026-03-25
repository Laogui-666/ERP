import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { AppError, createSuccessResponse } from '@/types/api'
import { logApiError } from '@/lib/logger'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, '请输入当前密码'),
  newPassword: z
    .string()
    .min(8, '新密码至少8位')
    .max(50, '新密码最多50位')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      '新密码需包含大小写字母和数字',
    ),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      throw new AppError('UNAUTHORIZED', '未登录', 401)
    }

    const body = await request.json()
    const data = changePasswordSchema.parse(body)

    // 查询当前密码
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { passwordHash: true },
    })
    if (!dbUser) {
      throw new AppError('NOT_FOUND', '用户不存在', 404)
    }

    // 空密码检测（客服创建订单自动注册的客户）
    if (dbUser.passwordHash === '') {
      throw new AppError(
        'EMPTY_PASSWORD',
        '您的账号尚未设置密码，请通过"忘记密码"流程设置',
        400,
      )
    }

    // 验证旧密码
    const isOldValid = await bcrypt.compare(data.oldPassword, dbUser.passwordHash)
    if (!isOldValid) {
      throw new AppError('INVALID_PASSWORD', '当前密码错误', 401)
    }

    // 哈希新密码
    const newHash = await bcrypt.hash(data.newPassword, 10)

    // 更新密码
    await prisma.user.update({
      where: { id: user.userId },
      data: { passwordHash: newHash },
    })

    return NextResponse.json(createSuccessResponse({ message: '密码修改成功' }))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        new AppError(
          'VALIDATION_ERROR',
          error.errors[0]?.message ?? '参数校验失败',
          400,
          error.errors,
        ).toJSON(),
        { status: 400 },
      )
    }
    logApiError('change-password', error)
    throw error
  }
}
