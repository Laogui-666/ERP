import { LiquidCard } from '@design-system/components/liquid-card'

export default function OrderDetailLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* 头部骨架 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-liquid-ocean/10" />
          <div className="w-32 h-5 rounded bg-liquid-ocean/10" />
        </div>
        <div className="w-16 h-5 rounded-full bg-liquid-ocean/10" />
      </div>

      {/* 状态时间线骨架 */}
      <LiquidCard className="p-5 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-liquid-ocean/10 shrink-0" />
            <div className="space-y-1">
              <div className="w-20 h-4 rounded bg-liquid-ocean/10" />
              <div className="w-16 h-3 rounded bg-liquid-ocean/5" />
            </div>
          </div>
        ))}
      </LiquidCard>

      {/* 资料区骨架 */}
      <LiquidCard className="p-5 space-y-3">
        <div className="w-24 h-5 rounded bg-liquid-ocean/10" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 rounded-xl bg-liquid-ocean/5 space-y-2">
            <div className="w-32 h-4 rounded bg-liquid-ocean/10" />
            <div className="w-48 h-3 rounded bg-liquid-ocean/5" />
          </div>
        ))}
      </LiquidCard>
    </div>
  )
}
