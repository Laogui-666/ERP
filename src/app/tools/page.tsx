import Link from 'next/link'
import { Card } from '@shared/ui/card'

const TOOLS = [
  { name: '签证资讯', desc: '各国签证政策实时更新，出行无忧', href: '/portal/tools/news', color: 'from-blue-100 to-cyan-50', icon: '📰' },
  { name: '行程助手', desc: 'AI 智能规划旅行路线', href: '/portal/tools/itinerary', color: 'from-green-100 to-emerald-50', icon: '🗺️' },
  { name: '申请表助手', desc: '各国签证表智能填写，告别繁琐', href: '/portal/tools/form-helper', color: 'from-amber-100 to-orange-50', icon: '📝' },
  { name: '签证评估', desc: 'AI 评估通过率与拒签风险', href: '/portal/tools/assessment', color: 'from-purple-100 to-violet-50', icon: '🔍' },
  { name: '翻译助手', desc: '多语言即时翻译，精准专业', href: '/portal/tools/translator', color: 'from-pink-100 to-rose-50', icon: '🌐' },
  { name: '证明文件', desc: '在职证明、收入证明等一键生成', href: '/portal/tools/documents', color: 'from-indigo-100 to-blue-50', icon: '📄' },
]

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6 bg-white min-h-screen">
      {/* 顶栏 */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 transition-colors hover:bg-gray-200 shadow-sm"
        >
          <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">智能工具箱</h1>
          <p className="text-sm text-gray-600">华夏签证为你准备的旅行助手</p>
        </div>
      </div>

      {/* 工具卡片列表 */}
      <div className="space-y-4">
        {TOOLS.map((tool) => (
          <Link key={tool.name} href={tool.href}>
            <Card
              padding="md"
              shadow="sm"
              className="group flex items-center gap-4 rounded-xl transition-all duration-200 hover:shadow-md active:scale-[0.97] min-h-[100px]"
            >
              {/* 图标 */}
              <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tool.color} transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                <span className="text-2xl">{tool.icon}</span>
              </div>

              {/* 文字 */}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900">
                  {tool.name}
                </h3>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                  {tool.desc}
                </p>
              </div>

              {/* 箭头 */}
              <svg
                className="h-5 w-5 flex-shrink-0 text-gray-400 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-primary"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Card>
          </Link>
        ))}
      </div>

      {/* 底部提示 */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-5 text-center shadow-sm">
        <p className="text-sm text-gray-700">
          💡 所有工具均可免费使用
        </p>
        <p className="mt-1 text-xs text-gray-500">
          登录后可保存历史记录和偏好设置
        </p>
      </div>

      {/* 底部安全留白 */}
      <div className="h-6" />
    </div>
  )
}
