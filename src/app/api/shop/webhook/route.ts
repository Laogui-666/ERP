import { NextRequest, NextResponse } from 'next/server'
import { AppError } from '@/types/api'

// POST /api/shop/webhook - 店铺订单回调（预留接口）
// 将来支持网店平台推送订单变更事件到 ERP
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    new AppError(
      'NOT_IMPLEMENTED',
      '店铺回调功能暂未开放，接口已预留',
      501
    ).toJSON(),
    { status: 501 }
  )
}
