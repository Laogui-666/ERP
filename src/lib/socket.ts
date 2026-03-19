import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import { verifyAccessToken } from '@/lib/auth'

let io: Server | null = null

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  // Authentication middleware
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth.token as string | undefined
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
