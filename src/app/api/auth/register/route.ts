import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signAccessToken, signRefreshToken, setAuthCookies } from '@/lib/auth'
import { AppError, createSuccessResponse } from '@/types/api'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  company: z.object({
    name: z.string().min(1).max(100),
    phone: z.string().optional(),
    email: z.string().email().optional(),
  }),
  user: z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(8),
    realName: z.string().min(1).max(50),
    phone: z.string().min(11).max(20),
    email: z.string().email().optional(),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = registerSchema.parse(body)

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username: data.user.username },
    })
    if (existingUser) {
      throw new AppError('DUPLICATE', '用户名已存在', 409)
    }

    // 检查手机号是否已存在
    const existingPhone = await prisma.user.findUnique({
      where: { phone: data.user.phone },
    })
    if (existingPhone) {
      throw new AppError('DUPLICATE', '手机号已注册', 409)
    }

    const passwordHash = await bcrypt.hash(data.user.password, 12)

    // 创建公司 + 管理员用户（同一事务）
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: data.company.name,
          phone: data.company.phone ?? null,
          email: data.company.email ?? null,
        },
      })

      const user = await tx.user.create({
        data: {
          companyId: company.id,
          username: data.user.username,
          phone: data.user.phone,
          email: data.user.email ?? null,
          passwordHash,
          realName: data.user.realName,
          role: 'COMPANY_OWNER',
        },
      })

      return { company, user }
    })

    const payload = {
      userId: result.user.id,
      username: result.user.username,
      role: result.user.role,
      companyId: result.company.id,
      departmentId: null,
    }

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(payload),
      signRefreshToken(payload),
    ])

    await setAuthCookies(accessToken, refreshToken)

    return NextResponse.json(
      createSuccessResponse({
        user: {
          id: result.user.id,
          username: result.user.username,
          realName: result.user.realName,
          role: result.user.role,
          companyId: result.company.id,
          company: result.company.name,
        },
      }),
      { status: 201 }
    )
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
