// 加载环境变量（必须在其他 import 之前）
import { config } from 'dotenv'
config({ path: '.env.local' })

// 修复 Next.js 15 + tsx 的 AsyncLocalStorage 兼容性问题
// tsx 的 CJS 模式下 Next.js 内部 AsyncLocalStorage 不可用，需要在 import next 之前修补
if (typeof globalThis.AsyncLocalStorage === 'undefined') {
  const { AsyncLocalStorage } = require('async_hooks')
  ;(globalThis as any).AsyncLocalStorage = AsyncLocalStorage
}

import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { initSocketServer } from '@shared/lib/socket'

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT ?? '3002', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  // 初始化 Socket.io（复用同一 HTTP 服务器）
  initSocketServer(server)

  server.listen(port, hostname, () => {
    process.stdout.write(`🚀 Server ready on http://${hostname}:${port}\n`)
    process.stdout.write(`🔌 Socket.io enabled\n`)
  })
})
