import { LiquidCard } from '@design-system/components/liquid-card';
import { LiquidButton } from '@design-system/components/liquid-button';
import { LiquidInput } from '@design-system/components/liquid-input';

export default function TestComponentsPage() {
  return (
    <div className="min-h-screen bg-gradient-liquid p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-liquid-deep mb-8 text-center">
          组件测试页面
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 按钮测试 */}
          <LiquidCard padding="lg">
            <h2 className="text-xl font-semibold text-liquid-deep mb-4">按钮测试</h2>
            <div className="space-y-3">
              <LiquidButton variant="primary">主要按钮</LiquidButton>
              <LiquidButton variant="secondary">次要按钮</LiquidButton>
              <LiquidButton variant="ghost">幽灵按钮</LiquidButton>
              <LiquidButton variant="liquid">液态按钮</LiquidButton>
            </div>
          </LiquidCard>
          
          {/* 输入框测试 */}
          <LiquidCard padding="lg">
            <h2 className="text-xl font-semibold text-liquid-deep mb-4">输入框测试</h2>
            <div className="space-y-4">
              <LiquidInput
                label="用户名"
                placeholder="请输入用户名"
              />
              <LiquidInput
                label="密码"
                type="password"
                placeholder="请输入密码"
              />
            </div>
          </LiquidCard>
        </div>
        
        <div className="mt-8">
          <LiquidCard padding="lg" variant="liquid-elevated">
            <h2 className="text-xl font-semibold text-liquid-deep mb-4">卡片测试</h2>
            <p className="text-liquid-deep">
              这是一个液态玻璃卡片，具有光泽效果和阴影。
              测试页面用于验证液态玻璃组件是否正常工作。
            </p>
          </LiquidCard>
        </div>
      </div>
    </div>
  );
}
