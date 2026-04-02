import { AppNavbar } from '@/components/portal/app-navbar'
import { HeroSection } from '@/components/portal/hero-section'
import { DestinationCards } from '@/components/portal/destination-cards'
import { ToolShowcase } from '@/components/portal/tool-showcase'
import { ValueProps } from '@/components/portal/value-props'
import { HowItWorks } from '@/components/portal/how-it-works'
import { Testimonials } from '@/components/portal/testimonials'
import { StatsSection } from '@/components/portal/stats-section'
import { CtaSection } from '@/components/portal/cta-section'
import { AppFooter } from '@/components/portal/app-footer'
import { AppBottomTab } from '@/components/portal/app-bottom-tab'
import { DynamicBackground } from '@shared/ui/dynamic-bg'

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <DynamicBackground />
      <AppNavbar />
      <main className="pb-[68px]">
        <HeroSection />
        <DestinationCards />
        <ToolShowcase />
        <ValueProps />
        <HowItWorks />
        <Testimonials />
        <StatsSection />
        <CtaSection />
        <AppFooter />
      </main>
      <AppBottomTab />
    </div>
  )
}
