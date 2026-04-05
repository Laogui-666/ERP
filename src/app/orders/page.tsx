import { redirect } from 'next/navigation'

// /orders → 重定向到门户订单页（中间件已处理未登录跳转 /login）
export default function OrdersRedirectPage() {
  redirect('/portal/orders')
}
