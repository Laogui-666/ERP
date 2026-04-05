import { NextRequest, NextResponse } from 'next/server'
import { AppError } from '@shared/types/api'

// POST /api/shop/sync - 店铺订单同步（预留接口）
// 将来支持从网店（淘宝/拼多多/独立站等）一键同步订单到 ERP
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    new AppError(
      'NOT_IMPLEMENTED',
      '店铺同步功能暂未开放，接口已预留。支持同步来源：网店订单 → ERP 订单',
      501
    ).toJSON(),
    { status: 501 }
  )
}
