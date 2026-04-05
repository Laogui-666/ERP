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
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize')) || 10))
    const [itineraries, total] = await Promise.all([
      prisma.itinerary.findMany({ where: { userId: user.userId }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.itinerary.count({ where: { userId: user.userId } }),
    ])
    return NextResponse.json(createSuccessResponse(itineraries, { total, page, pageSize }))
  } catch { return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } }, { status: 500 }) }
}

const createSchema = z.object({
  title: z.string().min(1).max(200), destination: z.string().min(1).max(100),
  startDate: z.string().optional(), endDate: z.string().optional(),
  days: z.array(z.object({ day: z.number(), date: z.string().optional(), activities: z.array(z.object({ time: z.string(), place: z.string(), desc: z.string(), tips: z.string().optional() })) })),
  budget: z.number().positive().optional(), preferences: z.record(z.string()).optional(), isPublic: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: '未登录' } }, { status: 401 })
    const body = createSchema.parse(await request.json())
    const data: Record<string, unknown> = {
      userId: user.userId, companyId: user.companyId === 'system' ? null : user.companyId,
      title: body.title, destination: body.destination, days: body.days,
      isPublic: body.isPublic ?? false,
    }
    if (body.startDate) data.startDate = new Date(body.startDate)
    if (body.endDate) data.endDate = new Date(body.endDate)
    if (body.budget) data.budget = body.budget
    if (body.preferences) data.preferences = body.preferences
    const itinerary = await prisma.itinerary.create({ data: data as Parameters<typeof prisma.itinerary.create>[0]['data'] })
    return NextResponse.json(createSuccessResponse(itinerary), { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: '参数错误', details: error.errors } }, { status: 400 })
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } }, { status: 500 })
  }
}
