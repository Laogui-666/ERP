import { redirect } from 'next/navigation'

// Portal 根路径 → 回到首页
export default function PortalPage() {
  redirect('/')
}
