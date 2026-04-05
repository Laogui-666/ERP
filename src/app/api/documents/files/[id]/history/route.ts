import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getCurrentUser } from '@shared/lib/auth'
import { AppError, createSuccessResponse } from '@shared/types/api'

// GET /api/documents/files/[id]/history - 获取文件审核记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    // 查找文件及所属需求
    const docFile = await prisma.documentFile.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        requirement: {
          select: { id: true, orderId: true, name: true, status: true, rejectReason: true },
        },
      },
    })
    if (!docFile) throw new AppError('NOT_FOUND', '文件不存在', 404)

    // 从 OrderLog 获取该文件的审核记录
    const logs = await prisma.orderLog.findMany({
      where: {
        orderId: docFile.requirement.orderId,
        companyId: user.companyId,
        OR: [
          { action: { contains: docFile.fileName } },
          { detail: { contains: docFile.fileName } },
        ],
        action: { startsWith: '审核文件:' },
      },
      include: {
        user: { select: { realName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // 解析审核日志（从 metadata 提取结构化数据）
    const reviewHistory = logs.map(log => {
      const meta = (log.metadata ?? {}) as Record<string, unknown>
      return {
        id: log.id,
        action: log.action,
        detail: log.detail,
        reviewStatus: meta.reviewStatus as string | undefined,
        rejectReason: meta.rejectReason as string | undefined,
        reviewer: log.user.realName,
        reviewerRole: log.user.role,
        createdAt: log.createdAt.toISOString(),
      }
    })

    return NextResponse.json(createSuccessResponse({
      file: {
        id: docFile.id,
        fileName: docFile.fileName,
        reviewStatus: docFile.reviewStatus,
        rejectReason: docFile.rejectReason,
        requirement: docFile.requirement,
      },
      history: reviewHistory,
    }))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}
