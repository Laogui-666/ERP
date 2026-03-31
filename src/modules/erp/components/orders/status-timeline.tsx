'use client'

import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@erp/types/order'
import type { OrderStatus } from '@erp/types/order'
import { formatDateTime } from '@shared/lib/utils'

interface StatusTimelineProps {
  currentStatus: OrderStatus
  orderLogs: Array<{
    action: string
    fromStatus: string | null
    toStatus: string | null
    createdAt: string
    user: { realName: string }
  }>
}

// 6 步主线流程（不含终态判断）
const STEPS: Array<{ key: string; status: OrderStatus; icon: string }> = [
  { key: 'pending', status: 'PENDING_CONNECTION', icon: '📋' },
  { key: 'connected', status: 'CONNECTED', icon: '🤝' },
  { key: 'collecting', status: 'COLLECTING_DOCS', icon: '📤' },
  { key: 'review', status: 'UNDER_REVIEW', icon: '🔍' },
  { key: 'making', status: 'MAKING_MATERIALS', icon: '🛠' },
  { key: 'delivered', status: 'DELIVERED', icon: '✅' },
]

const TERMINAL_STATUSES: OrderStatus[] = ['APPROVED', 'REJECTED', 'PARTIAL']

export function StatusTimeline({ currentStatus, orderLogs }: StatusTimelineProps) {
  const isTerminal = TERMINAL_STATUSES.includes(currentStatus)

  // 从 orderLogs 中提取每步的完成时间
  const stepTimes: Record<string, string> = {}
  for (const log of orderLogs) {
    if (log.toStatus) {
      // 取最新的一条（logs 按时间倒序）
      if (!stepTimes[log.toStatus]) {
        stepTimes[log.toStatus] = log.createdAt
      }
    }
  }

  // 计算当前步骤索引
  const currentIndex = STEPS.findIndex((s) => s.status === currentStatus)

  return (
    <div className="space-y-0">
      {STEPS.map((step, i) => {
        const isDone = isTerminal || (currentIndex >= 0 && i <= currentIndex)
        const isCurrent = !isTerminal && i === currentIndex
        const time = stepTimes[step.status]

        return (
          <div key={step.key} className="flex gap-3">
            {/* 竖线 + 圆点 */}
            <div className="flex flex-col items-center">
              {/* 上半线 */}
              {i > 0 && (
                <div
                  className={`w-px flex-1 ${
                    isDone || (currentIndex >= 0 && i - 1 < currentIndex)
                      ? 'bg-[var(--color-primary)]'
                      : 'bg-white/10'
                  }`}
                />
              )}
              {i === 0 && <div className="w-px h-3" />}

              {/* 圆点 */}
              <div
                className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs transition-all ${
                  isCurrent
                    ? 'bg-[var(--color-primary)] text-white ring-4 ring-[var(--color-primary)]/20'
                    : isDone
                      ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
                      : 'bg-white/5 text-[var(--color-text-placeholder)]'
                }`}
              >
                {isDone && !isCurrent ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{step.icon}</span>
                )}
              </div>

              {/* 下半线 */}
              {i < STEPS.length - 1 && (
                <div
                  className={`w-px flex-1 ${
                    isDone && i < currentIndex
                      ? 'bg-[var(--color-primary)]'
                      : 'bg-white/10'
                  }`}
                />
              )}
              {i === STEPS.length - 1 && <div className="w-px h-3" />}
            </div>

            {/* 文字内容 */}
            <div className={`pb-5 pt-1 ${isCurrent ? '' : ''}`}>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium ${
                    isCurrent
                      ? 'text-[var(--color-text-primary)]'
                      : isDone
                        ? 'text-[var(--color-text-secondary)]'
                        : 'text-[var(--color-text-placeholder)]'
                  }`}
                >
                  {ORDER_STATUS_LABELS[step.status]}
                </span>
                {isCurrent && (
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: ORDER_STATUS_COLORS[step.status] }}
                  />
                )}
              </div>
              {time && (
                <span className="text-[10px] text-[var(--color-text-placeholder)]">
                  {formatDateTime(time)}
                </span>
              )}
            </div>
          </div>
        )
      })}

      {/* 终态展示 */}
      {isTerminal && (
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-px flex-1 bg-[var(--color-primary)]" />
            <div
              className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs"
              style={{
                backgroundColor: `${ORDER_STATUS_COLORS[currentStatus]}20`,
                color: ORDER_STATUS_COLORS[currentStatus],
              }}
            >
              {currentStatus === 'APPROVED' ? '🎉' : currentStatus === 'REJECTED' ? '😞' : '⚠️'}
            </div>
            <div className="w-px h-3" />
          </div>
          <div className="pb-3 pt-1">
            <span
              className="text-sm font-semibold"
              style={{ color: ORDER_STATUS_COLORS[currentStatus] }}
            >
              {ORDER_STATUS_LABELS[currentStatus]}
            </span>
            {stepTimes[currentStatus] && (
              <span className="block text-[10px] text-[var(--color-text-placeholder)]">
                {formatDateTime(stepTimes[currentStatus])}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
