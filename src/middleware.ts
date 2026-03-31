import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCurrentUser } from '@shared/lib/auth'
import { canAccessRoute } from '@shared/lib/rbac'

// 公开路由
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/reset-password',
  '/api/health',
  '/api/cron/',
  '/api/shop/',
  '/api/sms/',
  '/login',
  '/register',
  '/reset-password',
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
}

export async function middleware(request: NextRequest) {
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

  // 页面路由鉴权
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 门户页面 → 所有登录用户可访问
  if (pathname.startsWith('/portal')) {
    return NextResponse.next()
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
