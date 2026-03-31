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
 * 通用 API 请求封装
 * - 自动携带 Cookie（默认行为）
 * - 401 时自动刷新 Token 并重试一次
 * - 刷新失败则跳转登录页
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, init)

  // 非 401 直接返回
  if (res.status !== 401) return res

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
    // 刷新成功，重试原请求
    return fetch(input, init)
  }

  // 刷新失败，跳转登录
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }

  return res
}
