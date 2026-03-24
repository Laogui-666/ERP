import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import { verifyAccessToken } from '@/lib/auth'

let io: Server | null = null

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {}
  return Object.fromEntries(
    header.split(';').map(c => {
      const [k, ...v] = c.trim().split('=')
      return [k, v.join('=')]
    })
  )
}

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  // Authentication middleware — 同时支持 auth.token 和 HttpOnly Cookie
  io.use(async (socket: Socket, next) => {
    // 优先使用 auth.token（如果客户端显式传递）
    const authToken = socket.handshake.auth.token as string | undefined
    // fallback：从 Cookie 读取（HttpOnly Cookie 浏览器自动携带到握手请求）
    const cookies = parseCookies(socket.handshake.headers.cookie)
    const cookieToken = cookies['access_token']
    const token = authToken || cookieToken

    if (!token) {
      return next(new Error('Authentication required'))
    }

    try {
      const payload = await verifyAccessToken(token)
      socket.data.user = payload
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as { userId: string; companyId: string }

    // Join company room
    socket.join(`company:${user.companyId}`)
    // Join personal room
    socket.join(`user:${user.userId}`)

    socket.on('disconnect', () => {
      // cleanup
    })
  })

  return io
}

export function getSocketServer(): Server | null {
  return io
}

// Emit to specific user
export function emitToUser(userId: string, event: string, data: unknown): void {
  io?.to(`user:${userId}`).emit(event, data)
}

// Emit to company
export function emitToCompany(companyId: string, event: string, data: unknown): void {
  io?.to(`company:${companyId}`).emit(event, data)
}
