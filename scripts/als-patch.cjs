// 预加载脚本：在 Node.js 启动时修补 globalThis.AsyncLocalStorage
// 用于 Next.js 15 + tsx CJS 模式下的兼容性
if (typeof globalThis.AsyncLocalStorage === 'undefined') {
  const { AsyncLocalStorage } = require('node:async_hooks')
  globalThis.AsyncLocalStorage = AsyncLocalStorage
}
