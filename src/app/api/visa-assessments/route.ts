import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getCurrentUser } from '@shared/lib/auth'
import { createSuccessResponse } from '@shared/types/api'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: '未登录' } }, { status: 401 })
    const records = await prisma.visaAssessment.findMany({ where: { userId: user.userId }, orderBy: { createdAt: 'desc' }, take: 20 })
    return NextResponse.json(createSuccessResponse(records))
  } catch { return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } }, { status: 500 }) }
}

const createSchema = z.object({ country: z.string().min(1).max(50), visaType: z.string().min(1).max(50), answers: z.record(z.unknown()) })

function calcScore(answers: Record<string, unknown>): { score: number; level: string; suggestions: string[] } {
  let score = 50; const suggestions: string[] = []
  const income = answers.income as string
  if (income === 'high') score += 20; else if (income === 'medium') score += 10; else suggestions.push('建议提供充足的资产证明')
  const travelHistory = answers.travelHistory as string
  if (travelHistory === 'extensive') score += 15; else if (travelHistory === 'some') score += 8; else suggestions.push('良好的出境记录有助于提高通过率')
  const employment = answers.employment as string
  if (employment === 'stable') score += 10; else if (employment === 'self-employed') score += 5; else suggestions.push('稳定的工作证明可以增加可信度')
  if (!(answers.hasProperty as boolean)) suggestions.push('房产证明有助于证明回国约束力'); else score += 5
  score = Math.min(100, Math.max(0, score))
  if (suggestions.length === 0) suggestions.push('您的条件良好，建议尽快申请')
  return { score, level: score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low', suggestions }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: '未登录' } }, { status: 401 })
    const body = createSchema.parse(await request.json())
    const { score, level, suggestions } = calcScore(body.answers as Record<string, unknown>)
    const assessment = await prisma.visaAssessment.create({
      data: {
        userId: user.userId, companyId: user.companyId === 'system' ? null : user.companyId,
        country: body.country, visaType: body.visaType,
        answers: body.answers as Parameters<typeof prisma.visaAssessment.create>[0]['data']['answers'],
        score, level, suggestions,
      },
    })
    return NextResponse.json(createSuccessResponse(assessment), { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: '参数错误', details: error.errors } }, { status: 400 })
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } }, { status: 500 })
  }
}
