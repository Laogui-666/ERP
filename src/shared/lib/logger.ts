/**
 * 统一错误日志收集
 *
 * 当前实现：console.error + 结构化输出
 * 生产环境可替换为 Sentry / 自建日志服务
 */

interface ErrorLogEntry {
  level: 'error' | 'warn'
  context: string
  message: string
  stack: string
  meta: Record<string, unknown>
  timestamp: string
}

function extractError(error: unknown): { message: string; stack: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack ?? '' }
  }
  if (typeof error === 'string') {
    return { message: error, stack: '' }
  }
  return { message: JSON.stringify(error), stack: '' }
}

/**
 * API 路由错误日志
 */
export function logApiError(
  context: string,
  error: unknown,
  meta?: Record<string, unknown>
): void {
  const { message, stack } = extractError(error)
  const entry: ErrorLogEntry = {
    level: 'error',
    context,
    message,
    stack,
    meta: meta ?? {},
    timestamp: new Date().toISOString(),
  }

  console.error(`[API_ERROR] ${context}:`, entry)
}

/**
 * 业务逻辑警告日志
 */
export function logWarning(
  context: string,
  message: string,
  meta?: Record<string, unknown>
): void {
  const entry: ErrorLogEntry = {
    level: 'warn',
    context,
    message,
    stack: '',
    meta: meta ?? {},
    timestamp: new Date().toISOString(),
  }

  console.warn(`[WARN] ${context}:`, entry)
}

/**
 * API Route 统一错误处理
 * 返回标准错误响应
 */
export function handleApiError(error: unknown): {
  status: number
  body: { success: false; error: { code: string; message: string } }
} {
  // AppError — 业务错误
  if (error instanceof Error && 'code' in error && 'statusCode' in error) {
    const appError = error as { code: string; message: string; statusCode: number }
    return {
      status: appError.statusCode,
      body: {
        success: false,
        error: { code: appError.code, message: appError.message },
      },
    }
  }

  // ZodError — 参数校验
  if (error instanceof Error && error.name === 'ZodError') {
    return {
      status: 400,
      body: {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '参数校验失败' },
      },
    }
  }

  // 未知错误 — 不暴露内部信息
  logApiError('unhandled', error)
  return {
    status: 500,
    body: {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' },
    },
  }
}
