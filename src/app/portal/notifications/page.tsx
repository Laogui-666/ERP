import { redirect } from 'next/navigation'

// 消息 Tab → 复用现有客户通知页
export default function PortalNotificationsPage() {
  redirect('/customer/notifications')
}
