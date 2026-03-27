import { NextRequest, NextResponse } from 'next/server'
import { AppError } from '@/types/api'

// POST /api/sms/send - 发送短信（预留接口）
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    new AppError('SMS_NOT_ENABLED', '短信服务暂未启用，接口已预留', 501).toJSON(),
    { status: 501 }
  )
}
