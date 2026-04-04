import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getCurrentUser } from '@shared/lib/auth'
import { getSignedUrl } from '@shared/lib/oss'
import { AppError, createSuccessResponse } from '@shared/types/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    const docFile = await prisma.documentFile.findFirst({
      where: { id, companyId: user.companyId },
      select: { ossKey: true, fileName: true, fileType: true },
    })
    if (!docFile) throw new AppError('NOT_FOUND', '文件不存在', 404)

    const { url } = getSignedUrl(docFile.ossKey, 3600, docFile.fileType)

    return NextResponse.json(createSuccessResponse({
      url,
      fileName: docFile.fileName,
      fileType: docFile.fileType,
    }))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}
