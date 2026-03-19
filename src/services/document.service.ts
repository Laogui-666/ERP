import { prisma } from '@/lib/prisma'
import { AppError } from '@/types/api'
import type { JwtPayload } from '@/lib/auth'

export class DocumentService {
  async getRequirementsByOrder(orderId: string, user: JwtPayload) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, companyId: user.companyId },
    })

    if (!order) {
      throw new AppError('ORDER_NOT_FOUND', '订单不存在', 404)
    }

    return prisma.documentRequirement.findMany({
      where: { orderId, companyId: user.companyId },
      orderBy: { sortOrder: 'asc' },
      include: {
        files: true,
      },
    })
  }

  async createRequirement(
    orderId: string,
    data: { name: string; description?: string; isRequired?: boolean },
    user: JwtPayload,
  ) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, companyId: user.companyId },
    })

    if (!order) {
      throw new AppError('ORDER_NOT_FOUND', '订单不存在', 404)
    }

    const maxSort = await prisma.documentRequirement.findFirst({
      where: { orderId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    return prisma.documentRequirement.create({
      data: {
        orderId,
        companyId: user.companyId,
        name: data.name,
        description: data.description ?? null,
        isRequired: data.isRequired ?? true,
        sortOrder: (maxSort?.sortOrder ?? -1) + 1,
      },
    })
  }

  async uploadDocument(
    orderId: string,
    data: {
      requirementId: string
      fileName: string
      fileSize: number
      fileType: string
      ossKey: string
      ossUrl: string
    },
    user: JwtPayload,
  ) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, companyId: user.companyId },
    })

    if (!order) {
      throw new AppError('ORDER_NOT_FOUND', '订单不存在', 404)
    }

    // 检查 requirement 是否属于该订单
    const requirement = await prisma.documentRequirement.findFirst({
      where: { id: data.requirementId, orderId, companyId: user.companyId },
    })

    if (!requirement) {
      throw new AppError('REQUIREMENT_NOT_FOUND', '资料需求不存在', 404)
    }

    const file = await prisma.documentFile.create({
      data: {
        requirementId: data.requirementId,
        companyId: user.companyId,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
        ossKey: data.ossKey,
        ossUrl: data.ossUrl,
        uploadedBy: user.userId,
      },
    })

    // 更新资料需求状态为已上传
    await prisma.documentRequirement.update({
      where: { id: data.requirementId },
      data: { status: 'UPLOADED' },
    })

    // 写操作日志
    await prisma.orderLog.create({
      data: {
        orderId,
        userId: user.userId,
        action: '上传资料',
        detail: `上传文件: ${data.fileName}`,
        companyId: user.companyId,
        fromStatus: null,
        toStatus: null,
      },
    })

    return file
  }

  async reviewRequirement(
    requirementId: string,
    data: { status: 'APPROVED' | 'REJECTED' | 'SUPPLEMENT'; rejectReason?: string },
    user: JwtPayload,
  ) {
    const requirement = await prisma.documentRequirement.findFirst({
      where: { id: requirementId, companyId: user.companyId },
      include: { order: true },
    })

    if (!requirement) {
      throw new AppError('REQUIREMENT_NOT_FOUND', '资料需求不存在', 404)
    }

    return prisma.documentRequirement.update({
      where: { id: requirementId },
      data: {
        status: data.status,
        rejectReason: data.rejectReason ?? null,
      },
    })
  }

  async deleteDocument(fileId: string, user: JwtPayload) {
    const file = await prisma.documentFile.findFirst({
      where: { id: fileId, companyId: user.companyId },
    })

    if (!file) {
      throw new AppError('FILE_NOT_FOUND', '文件不存在', 404)
    }

    await prisma.documentFile.delete({
      where: { id: fileId },
    })
  }
}

export const documentService = new DocumentService()
