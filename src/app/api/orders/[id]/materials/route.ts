import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requirePermission, getDataScopeFilter } from '@/lib/rbac'
import { AppError, createSuccessResponse } from '@/types/api'
import { uploadFile, buildOssKey } from '@/lib/oss'

// GET /api/orders/[id]/materials - 获取签证材料列表
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'materials', 'read')

    const scopeFilter = getDataScopeFilter(user)
    const order = await prisma.order.findFirst({
      where: { id: params.id, ...scopeFilter },
    })
    if (!order) throw new AppError('NOT_FOUND', '订单不存在', 404)

    const materials = await prisma.visaMaterial.findMany({
      where: { orderId: params.id },
      orderBy: [{ version: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(createSuccessResponse(materials))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}

// POST /api/orders/[id]/materials - 上传签证材料
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    requirePermission(user, 'materials', 'create')

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const remark = formData.get('remark') as string | null

    if (!file) throw new AppError('VALIDATION_ERROR', '未提供文件', 400)

    // 文件类型校验
    const allowedTypes = [
      'application/pdf', 'image/jpeg', 'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
    ]
    if (!allowedTypes.includes(file.type)) {
      throw new AppError('INVALID_FILE_TYPE', `不支持的文件类型: ${file.type}`, 400)
    }

    // 文件大小校验
    if (file.size > 50 * 1024 * 1024) {
      throw new AppError('FILE_TOO_LARGE', '文件大小超出限制（最大 50MB）', 400)
    }

    // 验证订单
    const scopeFilter = getDataScopeFilter(user)
    const order = await prisma.order.findFirst({
      where: { id: params.id, ...scopeFilter },
    })
    if (!order) throw new AppError('NOT_FOUND', '订单不存在', 404)

    // 获取最新版本号
    const lastMaterial = await prisma.visaMaterial.findFirst({
      where: { orderId: params.id },
      orderBy: { version: 'desc' },
      select: { version: true },
    })
    const newVersion = (lastMaterial?.version ?? 0) + 1

    // 构建 OSS 路径
    const buffer = Buffer.from(await file.arrayBuffer())
    const ossKey = buildOssKey({
      companyId: user.companyId,
      orderId: params.id,
      type: 'materials',
      subId: `v${newVersion}`,
      fileName: file.name,
    })

    // 上传到 OSS
    const result = await uploadFile(buffer, ossKey, file.type)
    const ossUrl = result.url

    // 写入数据库
    const material = await prisma.$transaction(async (tx) => {
      const mat = await tx.visaMaterial.create({
        data: {
          orderId: params.id,
          companyId: user.companyId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          ossKey,
          ossUrl,
          remark: remark ?? null,
          uploadedBy: user.userId,
          version: newVersion,
        },
      })

      // 状态流转：MAKING_MATERIALS → PENDING_DELIVERY
      if (order.status === 'MAKING_MATERIALS') {
        await tx.order.update({
          where: { id: params.id },
          data: { status: 'PENDING_DELIVERY' },
        })

        await tx.orderLog.create({
          data: {
            orderId: params.id,
            companyId: user.companyId,
            userId: user.userId,
            action: '上传签证材料',
            fromStatus: 'MAKING_MATERIALS',
            toStatus: 'PENDING_DELIVERY',
            detail: `上传文件: ${file.name} (v${newVersion})`,
          },
        })
      } else {
        await tx.orderLog.create({
          data: {
            orderId: params.id,
            companyId: user.companyId,
            userId: user.userId,
            action: '上传签证材料',
            detail: `上传文件: ${file.name} (v${newVersion})`,
          },
        })
      }

      return mat
    })

    // 通知资料员
    if (order.collectorId && order.status === 'MAKING_MATERIALS') {
      await prisma.notification.create({
        data: {
          companyId: user.companyId,
          userId: order.collectorId,
          orderId: params.id,
          type: 'MATERIAL_UPLOADED',
          title: '签证材料已上传',
          content: `订单 ${order.orderNo} 的签证材料已上传，请查看并确认交付`,
        },
      })
    }

    return NextResponse.json(createSuccessResponse(material), { status: 201 })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}
