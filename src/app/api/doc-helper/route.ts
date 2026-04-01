import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getCurrentUser } from '@shared/lib/auth'
import { createSuccessResponse } from '@shared/types/api'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: '未登录' } }, { status: 401 })
    const { searchParams } = request.nextUrl
    const type = searchParams.get('type') || undefined
    const where: Record<string, unknown> = {}
    if (type) where.type = type
    const templates = await prisma.docHelperTemplate.findMany({ where, orderBy: [{ isSystem: 'desc' }, { createdAt: 'desc' }] })
    return NextResponse.json(createSuccessResponse(templates))
  } catch { return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } }, { status: 500 }) }
}

const generateSchema = z.object({ templateId: z.string().min(1), data: z.record(z.unknown()) })

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: '未登录' } }, { status: 401 })
    const body = generateSchema.parse(await request.json())
    const template = await prisma.docHelperTemplate.findUnique({ where: { id: body.templateId } })
    if (!template) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: '模板不存在' } }, { status: 404 })
    let content = template.template
    const data = body.data as Record<string, string>
    for (const [key, value] of Object.entries(data)) content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value))
    const doc = await prisma.generatedDocument.create({
      data: { userId: user.userId, companyId: user.companyId === 'system' ? null : user.companyId, templateId: body.templateId, data: body.data as Parameters<typeof prisma.generatedDocument.create>[0]['data']['data'], fileUrl: '' },
    })
    return NextResponse.json(createSuccessResponse({ ...doc, renderedContent: content }), { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: '参数错误', details: error.errors } }, { status: 400 })
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } }, { status: 500 })
  }
}
