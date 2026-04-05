'use client'

import { DynamicBackground } from '@shared/ui/dynamic-bg'
import { AppBottomTab } from '@/components/portal/app-bottom-tab'
import { AppNavbar } from '@/components/portal/app-navbar'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <DynamicBackground />
      <AppNavbar />
      {/* 内容区（顶部导航56px + 底部 Tab 68px） */}
      <main className="flex-1 pt-14 pb-[68px]">{children}</main>
      <AppBottomTab />
    </div>
  )
}
