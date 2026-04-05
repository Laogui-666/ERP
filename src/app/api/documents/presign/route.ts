import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getCurrentUser } from '@shared/lib/auth'
import { requirePermission } from '@shared/lib/rbac'
import { AppError, createSuccessResponse } from '@shared/types/api'
import { buildOssKey, generatePresignedPutUrl } from '@shared/lib/oss'
import { ALLOWED_FILE_TYPES } from '@shared/lib/file-types'
import { z } from 'zod'

const presignSchema = z.object({
  context: z.enum(['document', 'chat']).default('document'),
  requirementId: z.string().min(1).optional(),
  orderId: z.string().min(1).optional(),
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1),
})

// POST /api/documents/presign - 获取预签名上传 URL（客户端直传 OSS）
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    const body = await request.json()
    const data = presignSchema.parse(body)

    // 文件类型校验
    if (!ALLOWED_FILE_TYPES.includes(data.fileType)) {
      throw new AppError('INVALID_FILE_TYPE', `不支持的文件类型: ${data.fileType}`, 400)
    }

    // context 分支：权限检查 + ossKey 构建
    let ossKey: string

    if (data.context === 'chat') {
      // 聊天文件上传：需要 chat:send 权限
      requirePermission(user, 'chat', 'send')

      if (!data.orderId) {
        throw new AppError('VALIDATION_ERROR', '聊天上传需要 orderId', 400)
      }

      // 校验订单归属（同一公司 + 用户有权限访问）
      const order = await prisma.order.findFirst({
        where: {
          id: data.orderId,
          companyId: user.companyId,
        },
        select: { id: true },
      })
      if (!order) throw new AppError('NOT_FOUND', '订单不存在', 404)

      ossKey = buildOssKey({
        companyId: user.companyId,
        orderId: data.orderId,
        type: 'chat',
        fileName: data.fileName,
      })
    } else {
      // 资料文件上传：需要 documents:create 权限
      requirePermission(user, 'documents', 'create')

      if (!data.requirementId) {
        throw new AppError('VALIDATION_ERROR', '资料上传需要 requirementId', 400)
      }

      // 查询需求（校验 companyId）
      const requirement = await prisma.documentRequirement.findFirst({
        where: { id: data.requirementId, companyId: user.companyId },
        include: { order: { select: { id: true, companyId: true } } },
      })
      if (!requirement) throw new AppError('NOT_FOUND', '资料需求不存在', 404)

      ossKey = buildOssKey({
        companyId: user.companyId,
        orderId: requirement.order.id,
        type: 'documents',
        subId: data.requirementId,
        fileName: data.fileName,
      })
    }

    const { url } = await generatePresignedPutUrl(ossKey, data.fileType, 3600)

    return NextResponse.json(createSuccessResponse({ presignedUrl: url, ossKey }))
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
