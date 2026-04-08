import { LiquidButton } from '@design-system/components/liquid-button';
import { LiquidCard, LiquidCardHeader, LiquidCardContent, LiquidCardFooter } from '@design-system/components/liquid-card';
import { LiquidInput } from '@design-system/components/liquid-input';

export default function LiquidTestPage() {
  return (
    <div className="min-h-screen bg-gradient-liquid p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-liquid-deep mb-4">
            液态玻璃设计系统测试
          </h1>
          <p className="text-liquid-mist text-lg max-w-2xl mx-auto">
            验证液态玻璃风格组件是否正常工作
          </p>
        </div>

        {/* 组件测试区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* 按钮测试 */}
          <div>
            <LiquidCard padding="lg">
              <LiquidCardHeader>
                <h2 className="text-xl font-semibold text-liquid-deep">按钮组件测试</h2>
              </LiquidCardHeader>
              <LiquidCardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <LiquidButton variant="primary">主要按钮</LiquidButton>
                    <LiquidButton variant="secondary">次要按钮</LiquidButton>
                    <LiquidButton variant="ghost">幽灵按钮</LiquidButton>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <LiquidButton variant="liquid">液态按钮</LiquidButton>
                    <LiquidButton variant="liquid-fill">填充液态按钮</LiquidButton>
                    <LiquidButton variant="primary" size="sm">小型按钮</LiquidButton>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <LiquidButton variant="primary" size="lg">大型按钮</LiquidButton>
                  </div>
                </div>
              </LiquidCardContent>
            </LiquidCard>
          </div>

          {/* 输入框测试 */}
          <div>
            <LiquidCard padding="lg">
              <LiquidCardHeader>
                <h2 className="text-xl font-semibold text-liquid-deep">输入框组件测试</h2>
              </LiquidCardHeader>
              <LiquidCardContent>
                <div className="space-y-4">
                  <LiquidInput
                    label="标准输入框"
                    placeholder="请输入内容"
                    variant="liquid"
                  />
                  <LiquidInput
                    label="带错误信息"
                    placeholder="请输入内容"
                    error="这是错误信息"
                    variant="liquid"
                  />
                  <LiquidInput
                    label="带辅助文本"
                    placeholder="请输入内容"
                    helperText="这是辅助文本"
                    variant="liquid"
                  />
                  <LiquidInput
                    label="实线风格"
                    placeholder="请输入内容"
                    variant="solid"
                  />
                </div>
              </LiquidCardContent>
            </LiquidCard>
          </div>

          {/* 卡片测试 */}
          <div>
            <LiquidCard padding="lg">
              <LiquidCardHeader>
                <h2 className="text-xl font-semibold text-liquid-deep">卡片组件测试</h2>
              </LiquidCardHeader>
              <LiquidCardContent>
                <p className="text-liquid-deep">
                  这是一个液态玻璃卡片，具有光泽效果和阴影。
                </p>
                <div className="mt-4 space-y-3">
                  <LiquidCard padding="sm" variant="solid" className="bg-white/80">
                    <p className="text-liquid-deep">实线风格卡片</p>
                  </LiquidCard>
                  <LiquidCard padding="sm" variant="outlined">
                    <p className="text-liquid-deep">描边风格卡片</p>
                  </LiquidCard>
                </div>
              </LiquidCardContent>
              <LiquidCardFooter>
                <LiquidButton variant="liquid">卡片操作按钮</LiquidButton>
              </LiquidCardFooter>
            </LiquidCard>
          </div>

          {/* 颜色测试 */}
          <div>
            <LiquidCard padding="lg">
              <LiquidCardHeader>
                <h2 className="text-xl font-semibold text-liquid-deep">颜色系统测试</h2>
              </LiquidCardHeader>
              <LiquidCardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {[
                    { name: 'ocean', color: 'bg-liquid-ocean' },
                    { name: 'oceanLight', color: 'bg-liquid-oceanLight' },
                    { name: 'sand', color: 'bg-liquid-sand' },
                    { name: 'mist', color: 'bg-liquid-mist' },
                    { name: 'deep', color: 'bg-liquid-deep' },
                    { name: 'light', color: 'bg-liquid-light' },
                    { name: 'cream', color: 'bg-liquid-cream' },
                    { name: 'steel', color: 'bg-liquid-steel' },
                    { name: 'silver', color: 'bg-liquid-silver' },
                  ].map((color) => (
                    <div key={color.name} className="flex flex-col items-center">
                      <div className={`${color.color} w-16 h-16 rounded-2xl mb-2`} />
                      <span className="text-xs text-liquid-mist">{color.name}</span>
                    </div>
                  ))}
                </div>
              </LiquidCardContent>
            </LiquidCard>
          </div>
        </div>

        {/* 响应式测试 */}
        <div className="mt-8 text-center text-liquid-mist text-sm">
          <p>本页面测试了液态玻璃设计系统的核心功能</p>
          <p className="mt-2">包括按钮、输入框、卡片组件和颜色系统</p>
        </div>
      </div>
    </div>
  );
}
