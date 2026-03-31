import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@shared/lib/prisma'
import { getCurrentUser } from '@shared/lib/auth'
import { AppError, createSuccessResponse } from '@shared/types/api'
import { emitToUser } from '@shared/lib/socket'

// POST /api/orders/[id]/submit - 客户确认提交资料
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser(request)
    if (!user) throw new AppError('UNAUTHORIZED', '未登录', 401)

    // 只有客户能提交自己的订单
    const order = await prisma.order.findFirst({
      where: { id, customerId: user.userId, companyId: user.companyId },
      select: {
        id: true,
        orderNo: true,
        status: true,
        collectorId: true,
        customerName: true,
        documentRequirements: {
          select: {
            id: true,
            name: true,
            status: true,
            _count: { select: { files: true } },
          },
        },
      },
    })
    if (!order) throw new AppError('NOT_FOUND', '订单不存在', 404)

    // 验证状态
    if (order.status !== 'COLLECTING_DOCS') {
      throw new AppError('INVALID_STATUS', `当前状态（${order.status}）不可提交`, 400)
    }

    // 找出有文件的 requirements
    const withFiles = order.documentRequirements.filter((r) => r._count.files > 0)
    if (withFiles.length === 0) {
      throw new AppError('NO_FILES', '请至少上传一份资料后再提交', 400)
    }

    // 幂等：检查是否已提交过（所有有文件的已是 REVIEWING）
    const alreadySubmitted = withFiles.every((r) => r.status === 'REVIEWING')
    if (alreadySubmitted) {
      return NextResponse.json(createSuccessResponse({
        message: '资料已提交，正在审核中',
        submittedCount: withFiles.length,
      }))
    }

    // 事务：将有文件的 requirement → REVIEWING
    await prisma.$transaction(async (tx) => {
      // 更新有文件的 requirements
      for (const req of withFiles) {
        if (req.status !== 'REVIEWING' && req.status !== 'APPROVED') {
          await tx.documentRequirement.update({
            where: { id: req.id },
            data: { status: 'REVIEWING' },
          })
        }
      }

      // 操作日志
      await tx.orderLog.create({
        data: {
          orderId: id,
          companyId: user.companyId,
          userId: user.userId,
          action: '客户确认提交资料',
          detail: `提交了 ${withFiles.length} 项资料`,
        },
      })

      // 通知资料员
      if (order.collectorId) {
        const names = withFiles.map((r) => r.name).join('、')
        await tx.notification.create({
          data: {
            companyId: user.companyId,
            userId: order.collectorId,
            orderId: id,
            type: 'DOCS_SUBMITTED',
            title: `订单 ${order.orderNo} 客户已提交资料`,
            content: `${order.customerName} 已上传 ${withFiles.length} 项资料并确认提交，请及时审核：${names}`,
          },
        })
      }
    })

    // Socket 推送给资料员
    if (order.collectorId) {
      emitToUser(order.collectorId, 'notification', {
        type: 'DOCS_SUBMITTED',
        title: '客户已提交资料',
        orderId: id,
        orderNo: order.orderNo,
      })
    }

    return NextResponse.json(createSuccessResponse({
      message: '提交成功，资料员将尽快审核',
      submittedCount: withFiles.length,
    }))
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }
    throw error
  }
}
