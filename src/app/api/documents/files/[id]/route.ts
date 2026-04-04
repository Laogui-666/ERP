import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getCurrentUser } from '@shared/lib/auth'
import { requirePermission } from '@shared/lib/rbac'
import { AppError, createSuccessResponse } from '@shared/types/api'
import { deleteFile } from '@shared/lib/oss'
import { emitToUser } from '@shared/lib/socket'
import { logApiError } from '@shared/lib/logger'



// PATCH /api/documents/files/[id] - 单文件审核
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'documents', 'update')

    const body = await request.json()
    const { rejectReason } = body as { rejectReason?: string }

    const docFile = await prisma.documentFile.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        requirement: {
          select: { id: true, orderId: true, name: true, order: { select: { orderNo: true, customerId: true, collectorId: true } } },
        },
      },
    })
    if (!docFile) throw new AppError('NOT_FOUND', '文件不存在', 404)

    // 更新单个文件的 rejectReason
    const updated = await prisma.documentFile.update({
      where: { id },
      data: { rejectReason: rejectReason ?? null },
    })

    // 写操作日志
    await prisma.orderLog.create({
      data: {
        orderId: docFile.requirement.orderId,
        companyId: user.companyId,
        userId: user.userId,
        action: `审核文件: ${docFile.requirement.name}`,
        detail: `文件 "${docFile.fileName}"${rejectReason ? ` - 驳回原因: ${rejectReason}` : ' - 通过'}`,
      },
    })

    // 如果有驳回原因，通知客户
    if (rejectReason) {
      const order = docFile.requirement.order
      if (order?.customerId) {
        await prisma.notification.create({
          data: {
            companyId: user.companyId,
            userId: order.customerId,
            orderId: docFile.requirement.orderId,
            type: 'DOC_REVIEWED',
            title: '资料审核结果',
            content: `"${docFile.requirement.name}"中的文件 "${docFile.fileName}" 需修改：${rejectReason}`,
          },
        })
        emitToUser(order.customerId, 'notification', {
          type: 'DOC_REVIEWED',
          title: '资料审核结果',
          orderId: docFile.requirement.orderId,
        })
      }
    }

    return NextResponse.json(createSuccessResponse(updated))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    if (error instanceof (await import('zod')).ZodError) {
      return NextResponse.json(
        new AppError('VALIDATION_ERROR', '参数校验失败', 400).toJSON(),
        { status: 400 }
      )
    }
    throw error
  }
}

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
