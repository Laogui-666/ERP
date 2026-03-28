import { NextRequest, NextResponse } from 'next/server'
import { verifyRefreshToken, signAccessToken, signRefreshToken, setAuthCookies } from '@/lib/auth'
import { AppError, createSuccessResponse } from '@/types/api'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value
    if (!refreshToken) {
      throw new AppError('UNAUTHORIZED', '请先登录', 401)
    }

    const payload = await verifyRefreshToken(refreshToken)

    const newPayload = {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
      companyId: payload.companyId,
      departmentId: payload.departmentId,
      realName: payload.realName,
      avatar: payload.avatar,
    }

    const [newAccessToken, newRefreshToken] = await Promise.all([
      signAccessToken(newPayload),
      signRefreshToken(newPayload),
    ])

    await setAuthCookies(newAccessToken, newRefreshToken)

    return NextResponse.json(createSuccessResponse({ message: 'Token已刷新' }))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    return NextResponse.json(
      new AppError('UNAUTHORIZED', 'Token无效', 401).toJSON(),
      { status: 401 }
    )
  }
}
