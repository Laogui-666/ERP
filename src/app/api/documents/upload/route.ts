import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import { uploadFile, buildOssKey } from '@/lib/oss'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/file-types'
import { z } from 'zod'

// POST /api/documents/upload - 上传文件
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'documents', 'create')

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const requirementId = formData.get('requirementId') as string | null
    const label = formData.get('label') as string | null

    if (!file) throw new AppError('VALIDATION_ERROR', '未提供文件', 400)
    if (!requirementId) throw new AppError('VALIDATION_ERROR', '未指定资料需求ID', 400)

    // 文件类型校验
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new AppError('INVALID_FILE_TYPE', `不支持的文件类型: ${file.type}`, 400)
    }

    // 文件大小校验
    if (file.size > MAX_FILE_SIZE) {
      throw new AppError('FILE_TOO_LARGE', `文件大小超出限制（最大 50MB）`, 400)
    }

    // 验证资料需求存在
    const requirement = await prisma.documentRequirement.findFirst({
      where: { id: requirementId, companyId: user.companyId },
      include: { order: { select: { id: true, companyId: true } } },
    })
    if (!requirement) throw new AppError('NOT_FOUND', '资料需求不存在', 404)

    // 构建 OSS 路径
    const buffer = Buffer.from(await file.arrayBuffer())
    const ossKey = buildOssKey({
      companyId: user.companyId,
      orderId: requirement.order.id,
      type: 'documents',
      subId: requirementId,
      fileName: file.name,
    })

    // 上传到 OSS
    const result = await uploadFile(buffer, ossKey, file.type)
    const ossUrl = result.url

    // 获取当前最大排序号
    const lastFile = await prisma.documentFile.findFirst({
      where: { requirementId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    // 写入数据库
    const docFile = await prisma.documentFile.create({
      data: {
        requirementId,
        companyId: user.companyId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        ossKey,
        ossUrl,
        uploadedBy: user.userId,
        sortOrder: (lastFile?.sortOrder ?? 0) + 1,
        label: label ?? null,
      },
    })

    // 更新资料需求状态为 UPLOADED
    await prisma.documentRequirement.update({
      where: { id: requirementId },
      data: { status: 'UPLOADED' },
    })

    // 写操作日志
    await prisma.orderLog.create({
      data: {
        orderId: requirement.order.id,
        companyId: user.companyId,
        userId: user.userId,
        action: `上传资料: ${requirement.name}`,
        detail: `文件: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`,
      },
    })

    return NextResponse.json(createSuccessResponse(docFile), { status: 201 })
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
