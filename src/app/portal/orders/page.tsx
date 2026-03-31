import { redirect } from 'next/navigation'

// 订单 Tab → 复用现有客户订单页
export default function PortalOrdersPage() {
  redirect('/customer/orders')
}
