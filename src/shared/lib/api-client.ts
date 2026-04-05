/**
 * 封装 fetch：自动处理 401 → 刷新 Token → 重试
 *
 * 所有 API 调用应使用此函数替代原生 fetch
 */

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST' })
    return res.ok
  } catch {
    return false
  }
}

/**
 * 判断当前页面是否为公开页面（不需要登录）
 * 公开页面上 401 不应跳转登录
 */
function isPublicPage(): boolean {
  if (typeof window === 'undefined') return true
  const path = window.location.pathname
  if (
    path === '/' ||
    path === '/login' ||
    path === '/register' ||
    path === '/reset-password' ||
    path.startsWith('/services') ||
    path.startsWith('/tools')
  ) {
    return true
  }
  return false
}

/**
 * 通用 API 请求封装
 * - 自动携带 Cookie（默认行为）
 * - 401 时自动刷新 Token 并重试一次
 * - 刷新失败则跳转登录页（公开页面除外）
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  // 禁用 Next.js fetch 缓存，确保每次请求都获取最新数据
  const mergedInit: RequestInit = {
    ...(init ?? {}),
    cache: 'no-store',
  }
  const res = await fetch(input, mergedInit)

  // 非 401 直接返回
  if (res.status !== 401) return res

  // 公开页面上的 401 静默处理，不跳转登录
  if (isPublicPage()) return res

  // 401：尝试刷新 Token（防抖：多请求只刷一次）
  if (!isRefreshing) {
    isRefreshing = true
    refreshPromise = refreshAccessToken().then((ok) => {
      isRefreshing = false
      refreshPromise = null
      return ok
    })
  }

  const refreshed = await refreshPromise
  if (refreshed) {
    // 刷新成功，重试原请求（同样禁用缓存）
    return fetch(input, mergedInit)
  }

  // 刷新失败，跳转登录（仅在非公开页面）
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }

  return res
}
