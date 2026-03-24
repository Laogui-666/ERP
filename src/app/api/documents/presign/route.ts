import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import { buildOssKey, generatePresignedPutUrl } from '@/lib/oss'
import { ALLOWED_FILE_TYPES } from '@/lib/file-types'
import { z } from 'zod'

const presignSchema = z.object({
  requirementId: z.string().min(1),
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1),
})

// POST /api/documents/presign - 获取预签名上传 URL（客户端直传 OSS）
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'documents', 'create')

    const body = await request.json()
    const data = presignSchema.parse(body)

    // 文件类型校验
    if (!ALLOWED_FILE_TYPES.includes(data.fileType)) {
      throw new AppError('INVALID_FILE_TYPE', `不支持的文件类型: ${data.fileType}`, 400)
    }

    // 查询需求（校验 companyId）
    const requirement = await prisma.documentRequirement.findFirst({
      where: { id: data.requirementId, companyId: user.companyId },
      include: { order: { select: { id: true, companyId: true } } },
    })
    if (!requirement) throw new AppError('NOT_FOUND', '资料需求不存在', 404)

    // 构建 OSS 路径 + 生成预签名 URL
    const ossKey = buildOssKey({
      companyId: user.companyId,
      orderId: requirement.order.id,
      type: 'documents',
      subId: data.requirementId,
      fileName: data.fileName,
    })

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
