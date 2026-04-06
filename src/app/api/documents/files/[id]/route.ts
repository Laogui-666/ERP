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
    const { rejectReason, reviewStatus } = body as { rejectReason?: string; reviewStatus?: string }

    const docFile = await prisma.documentFile.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        requirement: {
          select: { id: true, orderId: true, name: true, order: { select: { orderNo: true, customerId: true, collectorId: true } } },
        },
      },
    })
    if (!docFile) throw new AppError('NOT_FOUND', '文件不存在', 404)

    // 更新单个文件的审核状态和驳回原因
    const updateData: Record<string, unknown> = {}
    if (reviewStatus !== undefined) {
      updateData.reviewStatus = reviewStatus
      // 审核合格时清空驳回原因
      if (reviewStatus === 'APPROVED') updateData.rejectReason = null
    }
    if (rejectReason !== undefined) updateData.rejectReason = rejectReason || null
    const updated = await prisma.documentFile.update({
      where: { id },
      data: updateData,
    })

    // 同步更新父级资料需求的 status（基于同需求下所有文件的审核状态）
    const siblingFiles = await prisma.documentFile.findMany({
      where: { requirementId: docFile.requirementId },
      select: { reviewStatus: true },
    })
    const statuses = siblingFiles.map(f => f.reviewStatus || 'PENDING')
    let newReqStatus: string | null = null
    if (statuses.every(s => s === 'APPROVED')) {
      newReqStatus = 'APPROVED'
    } else if (statuses.some(s => s === 'REJECTED')) {
      newReqStatus = 'REJECTED'
    } else if (statuses.some(s => s === 'SUPPLEMENT')) {
      newReqStatus = 'SUPPLEMENT'
    } else if (statuses.some(s => s === 'APPROVED')) {
      newReqStatus = 'REVIEWING'
    }
    if (newReqStatus) {
      await prisma.documentRequirement.update({
        where: { id: docFile.requirementId },
        data: {
          status: newReqStatus as any,
          // 审核合格时清空需求级驳回原因
          ...(newReqStatus === 'APPROVED' ? { rejectReason: null } : {}),
        },
      })
    }

    // 写操作日志（含审核状态，供审核记录查询）
    const statusLabel = reviewStatus === 'APPROVED' ? '合格' : reviewStatus === 'REJECTED' ? '已驳回' : reviewStatus === 'SUPPLEMENT' ? '需补充' : reviewStatus
    await prisma.orderLog.create({
      data: {
        orderId: docFile.requirement.orderId,
        companyId: user.companyId,
        userId: user.userId,
        action: `审核文件: ${docFile.requirement.name}/${docFile.fileName}`,
        detail: `状态: ${statusLabel}${rejectReason ? ` | 原因: ${rejectReason}` : ''}`,
        metadata: {
          type: 'FILE_REVIEW',
          fileId: id,
          fileName: docFile.fileName,
          requirementName: docFile.requirement.name,
          reviewStatus,
          rejectReason: rejectReason || null,
        },
      },
    })

    // 通知客户（所有审核结果都需要通知，不仅仅是有驳回原因时）
    const order = docFile.requirement.order
    if (order?.customerId) {
      const statusText = reviewStatus === 'APPROVED' ? '已合格'
        : reviewStatus === 'REJECTED' ? '需要修改'
        : reviewStatus === 'SUPPLEMENT' ? '需要补充'
        : '已更新'
      const reasonText = rejectReason ? `：${rejectReason}` : ''

      await prisma.notification.create({
        data: {
          companyId: user.companyId,
          userId: order.customerId,
          orderId: docFile.requirement.orderId,
          type: 'DOC_REVIEWED',
          title: '资料审核结果',
          content: `"${docFile.requirement.name}"中的文件 "${docFile.fileName}" ${statusText}${reasonText}`,
        },
      })
      emitToUser(order.customerId, 'notification', {
        type: 'DOC_REVIEWED',
        title: '资料审核结果',
        orderId: docFile.requirement.orderId,
      })
    }

    // 通知资料员（操作员审核时资料员需要同步知道）
    if (order?.collectorId && order.collectorId !== user.userId) {
      const statusText = reviewStatus === 'APPROVED' ? '合格'
        : reviewStatus === 'REJECTED' ? '已驳回'
        : reviewStatus === 'SUPPLEMENT' ? '需补充'
        : '已更新'

      await prisma.notification.create({
        data: {
          companyId: user.companyId,
          userId: order.collectorId,
          orderId: docFile.requirement.orderId,
          type: 'DOC_REVIEWED',
          title: `订单 ${order.orderNo} 文件审核`,
          content: `文件 "${docFile.fileName}" ${statusText}`,
        },
      })
      emitToUser(order.collectorId, 'notification', {
        type: 'DOC_REVIEWED',
        title: '文件审核更新',
        orderId: docFile.requirement.orderId,
        orderNo: order.orderNo,
      })
    }

    // Socket 推送：文件审核事件（让所有在线用户刷新资料列表）
    try {
      const { emitToRoom } = await import('@shared/lib/socket')
      emitToRoom(`order:${docFile.requirement.orderId}`, 'documents:updated', {
        orderId: docFile.requirement.orderId,
        requirementId: docFile.requirementId,
        fileId: id,
        action: 'file_reviewed',
        reviewStatus,
      })
    } catch { /* socket push is best-effort */ }

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
