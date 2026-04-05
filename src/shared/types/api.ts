export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  meta?: ApiMeta
}

export interface ApiMeta {
  total?: number
  page?: number
  pageSize?: number
  totalPages?: number
  unreadCount?: number
  // 聊天分页
  hasMore?: boolean
  cursor?: { createdAt: string; id: string } | null
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly details?: unknown

  constructor(code: string, message: string, statusCode: number = 400, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }

  toJSON(): ApiError {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    }
  }
}

export function createSuccessResponse<T>(data: T, meta?: ApiMeta): ApiResponse<T> {
  const response: ApiResponse<T> = {
    success: true,
    data,
  }
  if (meta) response.meta = meta
  return response
}

export function createErrorResponse(error: AppError): ApiError {
  return error.toJSON()
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100
