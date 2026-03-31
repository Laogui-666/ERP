import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getCurrentUser } from '@shared/lib/auth'
import { requirePermission } from '@shared/lib/rbac'
import { AppError, createSuccessResponse } from '@shared/types/api'
import { deleteFile } from '@shared/lib/oss'
import { logApiError } from '@shared/lib/logger'

// DELETE /api/documents/files/[id] - 删除单个文件（OSS + DB）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'documents', 'delete')

    const docFile = await prisma.documentFile.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        requirement: {
          select: { id: true, orderId: true, name: true },
        },
      },
    })
    if (!docFile) throw new AppError('NOT_FOUND', '文件不存在', 404)

    // CUSTOMER 只能删自己上传的
    if (user.role === 'CUSTOMER' && docFile.uploadedBy !== user.userId) {
      throw new AppError('FORBIDDEN', '只能删除自己上传的文件', 403)
    }

    // 删除 OSS 文件
    try {
      await deleteFile(docFile.ossKey)
    } catch (err) {
      logApiError('oss-delete', err as Error, { ossKey: docFile.ossKey })
    }

    // 删除 DB 记录
    await prisma.documentFile.delete({ where: { id } })

    // 检查该 requirement 下是否还有文件，没有则回退 status 为 PENDING
    const remainingCount = await prisma.documentFile.count({
      where: { requirementId: docFile.requirementId },
    })
    if (remainingCount === 0) {
      await prisma.documentRequirement.update({
        where: { id: docFile.requirementId },
        data: { status: 'PENDING' },
      })
    }

    // 写操作日志
    await prisma.orderLog.create({
      data: {
        orderId: docFile.requirement.orderId,
        companyId: user.companyId,
        userId: user.userId,
        action: `删除资料文件: ${docFile.requirement.name}`,
        detail: `文件: ${docFile.fileName}`,
      },
    })

    return NextResponse.json(createSuccessResponse({ message: '已删除' }))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}
