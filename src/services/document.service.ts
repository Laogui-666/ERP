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
      where: { orderId },
      orderBy: { sortOrder: 'asc' },
      include: {
        documentFiles: true,
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
        name: data.name,
        description: data.description ?? null,
        isRequired: data.isRequired ?? true,
        sortOrder: (maxSort?.sortOrder ?? -1) + 1,
        companyId: user.companyId,
      },
    })
  }

  async uploadDocument(
    orderId: string,
    data: {
      requirementId?: string
      fileName: string
      fileUrl: string
      fileSize?: number
      fileType: string
      mimeType?: string
      remark?: string
    },
    user: JwtPayload,
  ) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, companyId: user.companyId },
    })

    if (!order) {
      throw new AppError('ORDER_NOT_FOUND', '订单不存在', 404)
    }

    const file = await prisma.documentFile.create({
      data: {
        orderId,
        requirementId: data.requirementId ?? null,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize ?? null,
        fileType: data.fileType as 'PASSPORT' | 'PHOTO' | 'APPLICATION_FORM' | 'SUPPORTING_DOC' | 'VISA_MATERIAL' | 'OTHER',
        mimeType: data.mimeType ?? null,
        uploaderId: user.userId,
        companyId: user.companyId,
        remark: data.remark ?? null,
      },
    })

    // Log
    await prisma.orderLog.create({
      data: {
        orderId,
        userId: user.userId,
        action: '上传资料',
        remark: `上传文件: ${data.fileName}`,
        companyId: user.companyId,
      },
    })

    return file
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
