import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getCurrentUser } from '@shared/lib/auth'
import { createSuccessResponse } from '@shared/types/api'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: '未登录' } }, { status: 401 })
    const records = await prisma.formRecord.findMany({ where: { userId: user.userId }, orderBy: { updatedAt: 'desc' }, take: 20 })
    return NextResponse.json(createSuccessResponse(records))
  } catch { return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } }, { status: 500 }) }
}

const createSchema = z.object({ templateId: z.string().min(1), data: z.record(z.unknown()), progress: z.number().min(0).max(100).optional() })

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: '未登录' } }, { status: 401 })
    const body = createSchema.parse(await request.json())
    const record = await prisma.formRecord.create({ data: { userId: user.userId, templateId: body.templateId, data: body.data as Parameters<typeof prisma.formRecord.create>[0]['data']['data'], progress: body.progress ?? 0 } })
    return NextResponse.json(createSuccessResponse(record), { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: '参数错误', details: error.errors } }, { status: 400 })
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } }, { status: 500 })
  }
}
