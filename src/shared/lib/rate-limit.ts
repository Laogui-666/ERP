import { NextRequest, NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'

// 速率限制配置
const RATE_LIMIT_CONFIG = {
  // 每个IP每分钟最大请求数
  maxRequestsPerMinute: 60,
  // 每个IP每小时最大请求数
  maxRequestsPerHour: 1000,
  // 缓存大小
  cacheSize: 10000,
  // 缓存过期时间（1小时）
  cacheTtl: 1000 * 60 * 60,
}

// 存储请求计数
interface RateLimitInfo {
  count: number
  hourCount: number
  lastRequest: number
}

// 创建缓存
const rateLimitCache = new LRUCache<string, RateLimitInfo>({
  max: RATE_LIMIT_CONFIG.cacheSize,
  ttl: RATE_LIMIT_CONFIG.cacheTtl,
})

/**
 * 速率限制中间件
 */
export function rateLimit() {
  return async function middleware(request: NextRequest) {
    // 获取客户端IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    
    // 跳过静态资源
    const pathname = request.nextUrl.pathname
    if (pathname.startsWith('/_next/') || pathname.startsWith('/api/health')) {
      return NextResponse.next()
    }

    // 跳过公开路由
    const publicRoutes = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/refresh',
      '/api/auth/reset-password',
      '/login',
      '/register',
      '/reset-password',
      '/services',
      '/tools',
    ]

    if (publicRoutes.some(route => pathname.startsWith(route))) {
      // 对公开路由应用更严格的限制
      return applyRateLimit(ip, request, 30, 300) // 每分钟30次，每小时300次
    }

    // 对其他路由应用默认限制
    return applyRateLimit(ip, request, RATE_LIMIT_CONFIG.maxRequestsPerMinute, RATE_LIMIT_CONFIG.maxRequestsPerHour)
  }
}

/**
 * 应用速率限制
 */
function applyRateLimit(ip: string, _request: NextRequest, maxPerMinute: number, maxPerHour: number): NextResponse {
  const now = Date.now()
  const key = `rate_limit:${ip}`
  
  const existing = rateLimitCache.get(key)
  
  if (existing) {
    // 计算时间差
    const timeSinceLastRequest = now - existing.lastRequest
    const timeSinceStartOfMinute = now % (1000 * 60)
    const timeSinceStartOfHour = now % (1000 * 60 * 60)
    
    // 重置计数（如果是新的分钟或小时）
    let count = existing.count
    let hourCount = existing.hourCount
    
    if (timeSinceStartOfMinute < timeSinceLastRequest) {
      count = 1
    } else {
      count++
    }
    
    if (timeSinceStartOfHour < timeSinceLastRequest) {
      hourCount = 1
    } else {
      hourCount++
    }
    
    // 检查是否超过限制
    if (count > maxPerMinute || hourCount > maxPerHour) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: '请求过于频繁，请稍后再试',
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
          },
        }
      )
    }
    
    // 更新缓存
    rateLimitCache.set(key, {
      count,
      hourCount,
      lastRequest: now,
    })
  } else {
    // 首次请求
    rateLimitCache.set(key, {
      count: 1,
      hourCount: 1,
      lastRequest: now,
    })
  }
  
  return NextResponse.next()
}

// 导出速率限制中间件
export default rateLimit