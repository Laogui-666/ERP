import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import { verifyAccessToken, type JwtPayload } from '@shared/lib/auth'
import { prisma } from '@shared/lib/prisma'
import { logApiError } from '@shared/lib/logger'

let io: Server | null = null

// ==================== Cookie 解析 ====================

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {}
  return Object.fromEntries(
    header.split(';').map(c => {
      const [k, ...v] = c.trim().split('=')
      return [k, v.join('=')]
    })
  )
}

// ==================== 聊天状态管理 ====================

// typing 限流：2s 冷却期
const typingCooldown = new Map<string, number>()

// mark-read debounce：3s 合并
const readDebounce = new Map<string, ReturnType<typeof setTimeout>>()

// 定期清理过期条目（每 5 分钟）
let cleanupInterval: ReturnType<typeof setInterval> | null = null

function startCleanupInterval() {
  if (cleanupInterval) return
  cleanupInterval = setInterval(() => {
    const now = Date.now()
    // 清理 1 分钟前的 typing 记录
    for (const [key, ts] of typingCooldown) {
      if (now - ts > 60_000) typingCooldown.delete(key)
    }
  }, 5 * 60 * 1000)
}

// ==================== 初始化 ====================

export function initSocketServer(httpServer: HttpServer): Server {
  const isDev = process.env.NODE_ENV !== 'production'
  io = new Server(httpServer, {
    cors: {
      origin: isDev
        ? [/localhost:\d+$/, /127\.0\.0\.1:\d+$/, process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002']
        : process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  // 认证中间件 — 支持 auth.token 和 HttpOnly Cookie
  io.use(async (socket: Socket, next) => {
    const authToken = socket.handshake.auth.token as string | undefined
    const cookies = parseCookies(socket.handshake.headers.cookie)
    const cookieToken = cookies['access_token']
    const token = authToken || cookieToken

    if (!token) {
      return next(new Error('Authentication required'))
    }

    try {
      const payload = await verifyAccessToken(token)
      // 保存完整 JwtPayload（含 realName + avatar）
      socket.data.user = payload
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', async (socket: Socket) => {
    const user = socket.data.user as JwtPayload

    // 加入公司房间 + 个人房间
    socket.join(`company:${user.companyId}`)
    socket.join(`user:${user.userId}`)

    // ======== Auto-join：加入最近活跃订单的聊天房间 ========
    try {
      const activeOrders = await prisma.order.findMany({
        where: {
          companyId: user.companyId,
          status: { notIn: ['APPROVED', 'REJECTED', 'PARTIAL'] },
          OR: [
            { customerId: user.userId },
            { collectorId: user.userId },
            { operatorId: user.userId },
            { createdBy: user.userId },
          ],
        },
        select: { id: true },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      })
      for (const order of activeOrders) {
        socket.join(`order:${order.id}`)
      }
    } catch (err) {
      logApiError('socket-auto-join', err, { userId: user.userId })
    }

    // ======== 聊天事件处理器 ========

    // chat:join — 加入订单聊天房间（含权限校验）
    socket.on('chat:join', async ({ orderId }: { orderId: string }) => {
      try {
        // 校验订单存在 + 用户有权限
        const order = await prisma.order.findFirst({
          where: {
            id: orderId,
            companyId: user.companyId,
            OR: [
              { customerId: user.userId },
              { collectorId: user.userId },
              { operatorId: user.userId },
              { createdBy: user.userId },
            ],
          },
          select: { id: true },
        })

        // 管理者也可以加入
        if (!order) {
          const isManager = ['COMPANY_OWNER', 'CS_ADMIN', 'VISA_ADMIN', 'SUPER_ADMIN'].includes(user.role)
          if (!isManager) {
            socket.emit('chat:error', { message: '无权访问该聊天' })
            return
          }
        }

        socket.join(`order:${orderId}`)
      } catch (err) {
        logApiError('chat-join', err, { orderId, userId: user.userId })
        socket.emit('chat:error', { message: '加入聊天失败' })
      }
    })

    // chat:leave — 离开聊天房间
    socket.on('chat:leave', ({ orderId }: { orderId: string }) => {
      socket.leave(`order:${orderId}`)
    })

    // chat:typing — 输入状态通知（2s 冷却）
    socket.on('chat:typing', ({ orderId }: { orderId: string }) => {
      const key = `${user.userId}:${orderId}`
      const now = Date.now()
      if (now - (typingCooldown.get(key) ?? 0) < 2000) return
      typingCooldown.set(key, now)

      socket.to(`order:${orderId}`).emit('chat:typing', {
        orderId,
        userId: user.userId,
        realName: user.realName,
      })
    })

    // chat:mark-read — 已读回执（3s debounce）
    socket.on('chat:mark-read', ({ orderId, lastReadMessageId }: { orderId: string; lastReadMessageId: string }) => {
      const key = `${user.userId}:${orderId}`

      // 清除之前的 timer
      const existing = readDebounce.get(key)
      if (existing) clearTimeout(existing)

      // 设置新的 debounce timer
      readDebounce.set(key, setTimeout(async () => {
        readDebounce.delete(key)
        try {
          const room = await prisma.chatRoom.findUnique({
            where: { orderId },
            select: { id: true },
          })
          if (!room) return

          await prisma.chatRead.upsert({
            where: { roomId_userId: { roomId: room.id, userId: user.userId } },
            update: { lastReadMessageId },
            create: { roomId: room.id, userId: user.userId, lastReadMessageId },
          })

          // 广播已读回执给同房间其他人
          socket.to(`order:${orderId}`).emit('chat:read', {
            orderId,
            userId: user.userId,
            realName: user.realName,
            lastReadMessageId,
          })
        } catch (err) {
          logApiError('chat-mark-read', err, { orderId, userId: user.userId })
        }
      }, 3000))
    })

    // ======== 通知事件处理器 ========

    // notification:read — 标记通知已读
    socket.on('notification:read', async ({ notificationId }: { notificationId: string }) => {
      try {
        // 这里可以添加实时更新逻辑
        // 实际的标记已读操作仍然通过 API 进行
        socket.emit('notification:read:ack', { notificationId })
      } catch (err) {
        logApiError('notification-read', err, { notificationId, userId: user.userId })
      }
    })

    // notification:mark-all-read — 标记所有通知已读
    socket.on('notification:mark-all-read', async () => {
      try {
        // 这里可以添加实时更新逻辑
        socket.emit('notification:mark-all-read:ack')
      } catch (err) {
        logApiError('notification-mark-all-read', err, { userId: user.userId })
      }
    })

    // ======== Disconnect 清理 ========
    socket.on('disconnect', () => {
      // 清理该用户的 typing cooldown
      for (const [key] of typingCooldown) {
        if (key.startsWith(`${user.userId}:`)) {
          typingCooldown.delete(key)
        }
      }
      // 清理该用户的 read debounce timers
      for (const [key, timer] of readDebounce) {
        if (key.startsWith(`${user.userId}:`)) {
          clearTimeout(timer)
          readDebounce.delete(key)
        }
      }
    })
  })

  // 启动定期清理
  startCleanupInterval()

  return io
}

// ==================== 导出函数 ====================

export function getSocketServer(): Server | null {
  return io
}

/** 推送给指定用户 */
export function emitToUser(userId: string, event: string, data: unknown): void {
  io?.to(`user:${userId}`).emit(event, data)
}

/** 推送给整个公司 */
export function emitToCompany(companyId: string, event: string, data: unknown): void {
  io?.to(`company:${companyId}`).emit(event, data)
}

/** 向指定房间广播 */
export function emitToRoom(room: string, event: string, data: unknown): void {
  io?.to(room).emit(event, data)
}

/** 推送通知给指定用户 */
export function emitNotificationToUser(userId: string, notification: {
  id: string
  type: string
  title: string
  content: string | null
  isRead: boolean
  orderId: string | null
  createdAt: string
}): void {
  io?.to(`user:${userId}`).emit('notification:new', notification)
}

/** 推送通知给公司所有用户 */
export function emitNotificationToCompany(companyId: string, notification: {
  id: string
  type: string
  title: string
  content: string | null
  isRead: boolean
  orderId: string | null
  createdAt: string
}): void {
  io?.to(`company:${companyId}`).emit('notification:new', notification)
}
