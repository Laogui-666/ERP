import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getCurrentUser } from '@shared/lib/auth'
import { createSuccessResponse } from '@shared/types/api'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    await getCurrentUser(request)
    const { searchParams } = request.nextUrl
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize')) || 10))
    const category = searchParams.get('category') || undefined
    const search = searchParams.get('search') || undefined

    const where: Record<string, unknown> = { isPublished: true }
    if (category) where.category = category
    if (search) where.OR = [{ title: { contains: search } }, { content: { contains: search } }]

    const [articles, total] = await Promise.all([
      prisma.newsArticle.findMany({
        where,
        select: { id: true, title: true, coverImage: true, category: true, tags: true, viewCount: true, isPinned: true, publishedAt: true, createdAt: true },
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
        skip: (page - 1) * pageSize, take: pageSize,
      }),
      prisma.newsArticle.count({ where }),
    ])
    return NextResponse.json(createSuccessResponse(articles, { total, page, pageSize }))
  } catch { return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } }, { status: 500 }) }
}

const createSchema = z.object({
  title: z.string().min(1).max(200), content: z.string().min(1), coverImage: z.string().url().optional(),
  category: z.string().min(1).max(50), tags: z.array(z.string()).optional(), isPublished: z.boolean().optional(), isPinned: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: '未登录' } }, { status: 401 })
    if (!['SUPER_ADMIN', 'COMPANY_OWNER', 'CS_ADMIN', 'VISA_ADMIN'].includes(user.role)) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: '无权操作' } }, { status: 403 })
    }
    const body = createSchema.parse(await request.json())
    const data: Record<string, unknown> = {
      companyId: user.companyId === 'system' ? null : user.companyId,
      title: body.title, content: body.content, category: body.category,
      authorId: user.userId, isPublished: body.isPublished ?? false, isPinned: body.isPinned ?? false,
    }
    if (body.coverImage) data.coverImage = body.coverImage
    if (body.tags) data.tags = body.tags
    if (body.isPublished) data.publishedAt = new Date()
    const article = await prisma.newsArticle.create({ data: data as Parameters<typeof prisma.newsArticle.create>[0]['data'] })
    return NextResponse.json(createSuccessResponse(article), { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: '参数错误', details: error.errors } }, { status: 400 })
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } }, { status: 500 })
  }
}
