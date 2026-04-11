'use client'

import { FilePreview } from '@shared/ui/file-preview'
import { formatDateTime } from '@shared/lib/utils'
import type { OrderStatus, VisaMaterial } from '@erp/types/order'

interface MaterialChecklistProps {
  status: OrderStatus
  materials: VisaMaterial[]
}

export function MaterialChecklist({ status, materials }: MaterialChecklistProps) {
  const isMaking = status === 'MAKING_MATERIALS'
  const canView = ['PENDING_DELIVERY', 'DELIVERED', 'APPROVED', 'REJECTED', 'PARTIAL'].includes(status)

  // 仅相关状态显示
  if (!isMaking && !canView) return null

  // 制作中提示
  if (isMaking) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-glass-text-primary flex items-center gap-2">
          <span>📥</span>
          <span>签证材料（为您制作）</span>
        </h3>
        <div className="rounded-glass-lg glass-card p-6 text-center">
          <div className="inline-block w-6 h-6 border-2 border-glass-border border-t-glass-primary rounded-full animate-spin mb-3" />
          <p className="text-sm text-glass-text-muted">
            签证材料正在制作中，请耐心等待...
          </p>
          <p className="text-xs text-glass-text-muted/60 mt-1">
            制作完成后会第一时间通知您
          </p>
        </div>
      </div>
    )
  }

  // 可下载/预览
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-glass-text-primary flex items-center gap-2">
        <span>📥</span>
        <span>签证材料</span>
        <span className="text-xs text-glass-text-muted font-normal">
          {materials.length} 份
        </span>
      </h3>

      {materials.length === 0 ? (
        <div className="rounded-glass-lg glass-card p-6 text-center">
          <p className="text-sm text-glass-text-muted">暂无签证材料</p>
        </div>
      ) : (
        <div className="space-y-2">
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="rounded-glass-lg glass-card p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <FilePreview
                  fileName={mat.fileName}
                  fileType={mat.fileType}
                  ossUrl={mat.ossUrl}
                  fileSize={mat.fileSize}
                  compact
                />
                <a
                  href={mat.ossUrl}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-glass-sm bg-glass-primary/15 text-glass-primary hover:bg-glass-primary/25 transition-colors glass-button-hover"
                  download={mat.fileName}
                >
                  下载
                </a>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-glass-text-muted/60">
                <span>版本 v{mat.version}</span>
                <span>{formatDateTime(mat.createdAt)}</span>
              </div>
              {mat.remark && (
                <p className="mt-1 text-xs text-glass-text-muted">
                  备注：{mat.remark}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
