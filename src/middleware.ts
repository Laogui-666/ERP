import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCurrentUser } from '@shared/lib/auth'
import { canAccessRoute } from '@shared/lib/rbac'
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
  '/portal/tools',
  '/portal/orders',
  '/portal/profile',
  '/portal/notifications',
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
    // 公开的 API 路由
    const publicApiRoutes = [
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
    ]
    
    const isPublicApi = publicApiRoutes.some(route => pathname.startsWith(route))
    
    if (!isPublicApi && !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '未登录或Token已过期' } },
        { status: 401 }
      )
    }
    
    // 注入用户信息到请求头（如果已登录）
    if (user) {
      const response = NextResponse.next()
      response.headers.set('x-user-id', user.userId)
      response.headers.set('x-company-id', user.companyId)
      response.headers.set('x-role', user.role)
      response.headers.set('x-department-id', user.departmentId ?? '')
      return response
    }
    
    return NextResponse.next()
  }

  // 页面路由鉴权
  if (!user) {
    // 公开页面不需要登录
    const publicPages = [
      '/',
      '/services',
      '/tools',
      '/portal',
      '/portal/tools',
      '/portal/news',
      '/portal/itinerary',
      '/portal/form-helper',
      '/portal/assessment',
      '/portal/translator',
      '/portal/documents',
    ]
    
    const isPublicPage = publicPages.some(route => pathname.startsWith(route))
    if (isPublicPage) {
      return NextResponse.next()
    }
    
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 门户页面 → 所有用户可访问（无论是否登录）
  if (pathname.startsWith('/portal')) {
    return NextResponse.next()
  }

  // /orders → 重定向到门户订单页（已登录用户）
  if (pathname === '/orders') {
    return NextResponse.redirect(new URL('/portal/orders', request.url))
  }

  // /profile → 重定向到门户个人中心（已登录用户）
  if (pathname === '/profile') {
    return NextResponse.redirect(new URL('/portal/profile', request.url))
  }

  // 客户访问 /admin → 跳转门户首页
  if (user.role === 'CUSTOMER' && pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 员工访问 /customer → 跳转门户首页
  if (user.role !== 'CUSTOMER' && pathname.startsWith('/customer')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // /admin 和 /customer 路由权限检查
  if (pathname.startsWith('/admin') || pathname.startsWith('/customer')) {
    if (!canAccessRoute(user.role, pathname)) {
      return NextResponse.redirect(new URL('/403', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
