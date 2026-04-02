import { redirect } from 'next/navigation'

// 通知中心移入"我的"页面，此路由重定向
export default function NotificationsRedirectPage() {
  redirect('/portal/profile')
}
