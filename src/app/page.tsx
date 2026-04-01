import { PortalHomePage } from '@/components/portal/portal-home'
import { PortalTopbar } from '@/components/portal/portal-topbar'
import { DynamicBackground } from '@shared/ui/dynamic-bg'

/**
 * 根路径首页 — Server Component
 * 门户首页，公开可浏览（未登录也能看）
 */
export default function HomePage() {
  return (
    <>
      <DynamicBackground />
      <PortalTopbar />
      <PortalHomePage />
    </>
  )
}
