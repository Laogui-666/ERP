import { LiquidCard } from '@design-system/components/liquid-card';

export default function SimpleTestPage() {
  return (
    <div className="min-h-screen bg-gradient-liquid p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-liquid-deep mb-6 text-center">
          简单测试页面
        </h1>
        
        <LiquidCard padding="lg">
          <h2 className="text-xl font-semibold text-liquid-deep mb-4">测试卡片</h2>
          <p className="text-liquid-deep">
            这是一个测试卡片，用于验证 LiquidCard 组件是否正常工作。
          </p>
        </LiquidCard>
      </div>
    </div>
  );
}
