import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getCurrentUser } from '@shared/lib/auth'
import { createSuccessResponse } from '@shared/types/api'
import { z } from 'zod'

// GET /api/translations - 我的翻译记录
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: '未登录' } }, { status: 401 })

    const records = await prisma.translationRequest.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json(createSuccessResponse(records))
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } }, { status: 500 })
  }
}

// POST /api/translations - 提交翻译请求
const createSchema = z.object({
  sourceLang: z.string().min(2).max(10),
  targetLang: z.string().min(2).max(10),
  docType: z.string().min(1).max(30),
  sourceUrl: z.string().url().optional(),
  text: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: '未登录' } }, { status: 401 })

    const body = createSchema.parse(await request.json())

    // TODO: 接入实际翻译服务，目前返回模拟结果
    const resultText = body.text ? `[翻译结果] ${body.text}` : '文件翻译处理中，请稍后查看'

    const record = await prisma.translationRequest.create({
      data: {
        userId: user.userId,
        companyId: user.companyId === 'system' ? null : user.companyId,
        sourceLang: body.sourceLang,
        targetLang: body.targetLang,
        docType: body.docType,
        sourceUrl: body.sourceUrl ?? null,
        resultText,
        status: 'completed',
      },
    })

    return NextResponse.json(createSuccessResponse(record), { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: '参数错误', details: error.errors } }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } }, { status: 500 })
  }
}
