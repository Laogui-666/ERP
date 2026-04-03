import { redirect } from 'next/navigation'

// /portal/tools → 重定向到工具箱首页
export default function PortalToolsRedirect() {
  redirect('/tools')
}
