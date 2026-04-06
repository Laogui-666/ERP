import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getCurrentUser } from '@shared/lib/auth'
import { requirePermission } from '@shared/lib/rbac'
import { AppError, createSuccessResponse } from '@shared/types/api'
import { getSignedUrl, getOssClient } from '@shared/lib/oss'
import { logApiError } from '@shared/lib/logger'
import { z } from 'zod'

const confirmSchema = z.object({
  context: z.enum(['document', 'chat']).default('document'),
  requirementId: z.string().min(1).optional(),
  orderId: z.string().min(1).optional(),
  ossKey: z.string().min(1),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive(),
  fileType: z.string().min(1),
  label: z.string().max(100).optional(),
})

// POST /api/documents/confirm - 确认文件已上传，写入 DB（或返回 ossUrl）
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    const body = await request.json()
    const data = confirmSchema.parse(body)

    // context 分支处理
    if (data.context === 'chat') {
      // 聊天文件确认：不写 DocumentFile，只返回签名 URL
      requirePermission(user, 'chat', 'send')

      if (!data.orderId) {
        throw new AppError('VALIDATION_ERROR', '聊天上传需要 orderId', 400)
      }

      // ossKey 安全校验：chat 路径
      const expectedPrefix = `companies/${user.companyId}/orders/${data.orderId}/chat/`
      if (!data.ossKey.startsWith(expectedPrefix)) {
        throw new AppError('INVALID_OSS_KEY', 'OSS 路径不合法', 400)
      }

      // 校验订单归属
      const order = await prisma.order.findFirst({
        where: { id: data.orderId, companyId: user.companyId },
        select: { id: true },
      })
      if (!order) throw new AppError('NOT_FOUND', '订单不存在', 404)

      // 签名下载 URL（7 天有效）
      const signed = getSignedUrl(data.ossKey, 7 * 24 * 3600)

      // 修正 OSS Content-Type（异步，不阻塞返回）
      try {
        const ossClient = getOssClient()
        await ossClient.copy(data.ossKey, data.ossKey, {
          headers: { 'x-oss-metadata-directive': 'REPLACE', 'Content-Type': data.fileType },
        })
      } catch (err) {
        logApiError('oss-put-meta-chat', err as Error, { ossKey: data.ossKey })
      }

      return NextResponse.json(createSuccessResponse({
        ossUrl: signed.url,
        ossKey: data.ossKey,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
      }), { status: 201 })
    }

    // 资料文件确认（现有逻辑）
    requirePermission(user, 'documents', 'create')

    if (!data.requirementId) {
      throw new AppError('VALIDATION_ERROR', '资料上传需要 requirementId', 400)
    }

    // 查询需求（校验 companyId）
    const requirement = await prisma.documentRequirement.findFirst({
      where: { id: data.requirementId, companyId: user.companyId },
      include: { order: { select: { id: true } } },
    })
    if (!requirement) throw new AppError('NOT_FOUND', '资料需求不存在', 404)

    // ossKey 安全校验：验证路径结构
    const expectedPrefix = `companies/${user.companyId}/orders/${requirement.order.id}/documents/${data.requirementId}/`
    if (!data.ossKey.startsWith(expectedPrefix)) {
      throw new AppError('INVALID_OSS_KEY', 'OSS 路径不合法', 400)
    }

    // 事务内处理
    const result = await prisma.$transaction(async (tx) => {
      // 签名下载 URL（7 天有效）
      const signed = getSignedUrl(data.ossKey, 7 * 24 * 3600)

      // 获取当前最大排序号
      const lastFile = await tx.documentFile.findFirst({
        where: { requirementId: data.requirementId! },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      })

      // 创建文件记录
      const docFile = await tx.documentFile.create({
        data: {
          requirementId: data.requirementId!,
          companyId: user.companyId,
          fileName: data.fileName,
          fileSize: data.fileSize,
          fileType: data.fileType,
          ossKey: data.ossKey,
          ossUrl: signed.url,
          uploadedBy: user.userId,
          sortOrder: (lastFile?.sortOrder ?? 0) + 1,
          label: data.label ?? null,
        },
      })

      // 条件更新需求状态
      if (['PENDING', 'REJECTED', 'SUPPLEMENT'].includes(requirement.status)) {
        await tx.documentRequirement.update({
          where: { id: data.requirementId! },
          data: { status: 'UPLOADED' },
        })
      }

      // 写操作日志
      await tx.orderLog.create({
        data: {
          orderId: requirement.order.id,
          companyId: user.companyId,
          userId: user.userId,
          action: `上传资料: ${requirement.name}`,
          detail: `文件: ${data.fileName} (${(data.fileSize / 1024).toFixed(1)}KB)`,
        },
      })

      return docFile
    })

    // 通知资料员/操作员：客户上传了新文件（事务外，不阻塞返回）
    try {
      const { emitToUser } = await import('@shared/lib/socket')
      const orderInfo = await prisma.order.findUnique({
        where: { id: requirement.order.id },
        select: { orderNo: true, collectorId: true, operatorId: true, customerId: true },
      })

      // 客户上传时通知资料员
      if (orderInfo?.collectorId && orderInfo.collectorId !== user.userId) {
        await prisma.notification.create({
          data: {
            companyId: user.companyId,
            userId: orderInfo.collectorId,
            orderId: requirement.order.id,
            type: 'DOC_REVIEWED',
            title: `订单 ${orderInfo.orderNo} 客户已上传资料`,
            content: `客户上传了"${requirement.name}"的文件：${data.fileName}`,
          },
        })
        emitToUser(orderInfo.collectorId, 'notification', {
          type: 'DOC_REVIEWED',
          title: '客户已上传资料',
          orderId: requirement.order.id,
          orderNo: orderInfo.orderNo,
        })
      }

      // 如果操作员在审核阶段，也通知操作员
      if (orderInfo?.operatorId && orderInfo.operatorId !== user.userId) {
        emitToUser(orderInfo.operatorId, 'notification', {
          type: 'DOC_REVIEWED',
          title: '客户已上传资料',
          orderId: requirement.order.id,
          orderNo: orderInfo.orderNo,
        })
      }

      // Socket 推送：文件变更事件（让所有在线用户刷新资料列表）
      const roomId = `order:${requirement.order.id}`
      const { emitToRoom } = await import('@shared/lib/socket')
      emitToRoom(roomId, 'documents:updated', {
        orderId: requirement.order.id,
        requirementId: data.requirementId,
        action: 'file_uploaded',
        fileName: data.fileName,
      })
    } catch (err) {
      logApiError('confirm-notify', err as Error)
    }

    // 修正 OSS Content-Type（事务外，不影响 DB 一致性）
    try {
      const ossClient = getOssClient()
      await ossClient.copy(data.ossKey, data.ossKey, {
        headers: { 'x-oss-metadata-directive': 'REPLACE', 'Content-Type': data.fileType },
      })
    } catch (err) {
      logApiError('oss-put-meta', err as Error, { ossKey: data.ossKey })
    }

    return NextResponse.json(createSuccessResponse(result), { status: 201 })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        new AppError('VALIDATION_ERROR', '参数校验失败', 400, error.errors).toJSON(),
        { status: 400 }
      )
    }
    throw error
  }
}
