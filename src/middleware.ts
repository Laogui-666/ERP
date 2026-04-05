import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCurrentUser } from '@shared/lib/auth'
import rateLimit from '@shared/lib/rate-limit'

// 公开路由（不需要登录即可访问）
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/reset-password',
  '/api/health',
  '/api/cron/',
  '/api/shop/',
  '/api/sms/',
  '/api/news',
  '/api/visa-assessments',
  '/api/translations',
  '/api/doc-helper',
  '/api/itineraries',
  '/api/form-templates',
  '/api/form-records',
  '/login',
  '/register',
  '/reset-password',
  '/services',
  '/tools',
  '/portal',
  '/403',
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
}

// 应用速率限制
const rateLimitMiddleware = rateLimit()

export async function middleware(request: NextRequest) {
  // 先应用速率限制
  const rateLimitResponse = await rateLimitMiddleware(request)
  if (rateLimitResponse.status !== 200) {
    return rateLimitResponse
  }

  const { pathname } = request.nextUrl

  // 公开路由直接放行
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // 首页公开可浏览（未登录也能看门户首页）
  if (pathname === '/') {
    return NextResponse.next()
  }

  // 统一鉴权（只调用一次 getCurrentUser）
  const user = await getCurrentUser(request)

  // API 路由鉴权
  if (pathname.startsWith('/api/')) {
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '未登录或Token已过期' } },
        { status: 401 }
      )
    }
    // 注入用户信息到请求头
    const response = NextResponse.next()
    response.headers.set('x-user-id', user.userId)
    response.headers.set('x-company-id', user.companyId)
    response.headers.set('x-role', user.role)
    response.headers.set('x-department-id', user.departmentId ?? '')
    return response
  }

  // 页面路由：未登录 → 跳转登录
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 已登录用户：按角色分流
  // 客户不能访问管理端 → 跳转客户端
  if (user.role === 'CUSTOMER' && pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/customer/orders', request.url))
  }

  // 员工不能访问客户端 → 跳转工作台
  if (user.role !== 'CUSTOMER' && user.role !== 'SUPER_ADMIN' && pathname.startsWith('/customer')) {
    return NextResponse.redirect(new URL('/admin/workspace', request.url))
  }

  // 其他所有页面放行（权限由页面组件内部控制）
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
