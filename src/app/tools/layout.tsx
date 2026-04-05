'use client'

import { DynamicBackground } from '@shared/ui/dynamic-bg'
import { AppBottomTab } from '@/components/portal/app-bottom-tab'

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <DynamicBackground />
      <main className="flex-1 pb-[68px]">{children}</main>
      <AppBottomTab />
    </div>
  )
}
