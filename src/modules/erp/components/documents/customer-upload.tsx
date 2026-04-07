'use client'

import { useState, useRef } from 'react'
import { apiFetch } from '@shared/lib/api-client'
import { useToast } from '@shared/ui/toast'
import { FilePreview } from '@shared/ui/file-preview'
import { CameraCapture } from '@shared/ui/camera-capture'
import { DOC_REQ_STATUS_LABELS } from '@erp/types/order'
import type { DocumentRequirement, DocReqStatus } from '@erp/types/order'

interface CustomerUploadProps {
  orderId: string
  requirements: DocumentRequirement[]
  applicantCount?: number
  applicants?: Array<{ id: string; name: string }>
  onRefresh: () => void
}

const STATUS_STYLES: Record<DocReqStatus, { dot: string; bg: string; text: string }> = {
  PENDING: { dot: 'bg-[#8E99A8]', bg: 'bg-white/[0.04]', text: 'text-[#8E99A8]' },
  UPLOADED: { dot: 'bg-[#7CA8B8]', bg: 'bg-[#7CA8B8]/[0.06]', text: 'text-[#7CA8B8]' },
  REVIEWING: { dot: 'bg-[#9B8EC4]', bg: 'bg-[#9B8EC4]/[0.06]', text: 'text-[#9B8EC4]' },
  APPROVED: { dot: 'bg-[#7FA87A]', bg: 'bg-[#7FA87A]/[0.06]', text: 'text-[#7FA87A]' },
  REJECTED: { dot: 'bg-[#B87C7C]', bg: 'bg-[#B87C7C]/[0.06]', text: 'text-[#B87C7C]' },
  SUPPLEMENT: { dot: 'bg-[#C4A97D]', bg: 'bg-[#C4A97D]/[0.06]', text: 'text-[#C4A97D]' },
}

export function CustomerUpload({ orderId: _orderId, requirements, applicantCount = 1, applicants = [], onRefresh }: CustomerUploadProps) {
  void _orderId
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [targetReqId, setTargetReqId] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [cameraTargetId, setCameraTargetId] = useState<string | null>(null)

  // 判断客户是否可操作此需求项
  const canUpload = (status: DocReqStatus) =>
    ['PENDING', 'REJECTED', 'SUPPLEMENT'].includes(status)

  // 清除某需求下的所有旧文件（用于重新提交）
  const clearRequirementFiles = async (requirementId: string): Promise<boolean> => {
    const req = requirements.find(r => r.id === requirementId)
    if (!req || req.files.length === 0) return true
    try {
      for (const file of req.files) {
        await apiFetch(`/api/documents/files/${file.id}`, { method: 'DELETE' })
      }
      return true
    } catch {
      toast('error', '清除旧文件失败')
      return false
    }
  }

  // 预签名三步上传（返回是否成功，不自动刷新——批量上传时由调用方统一刷新）
  const handleUpload = async (requirementId: string, file: File, clearFirst = false): Promise<boolean> => {
    // 如果需要先清空旧文件（重新提交场景）
    if (clearFirst) {
      const cleared = await clearRequirementFiles(requirementId)
      if (!cleared) return false
    }

    // 客户端预校验大小
    if (file.size > 50 * 1024 * 1024) {
      toast('error', '文件大小超出限制（最大 50MB）')
      return false
    }

    setUploadingId(requirementId)
    setUploadProgress(0)
    try {
      // 1. 获取预签名 URL
      const presignRes = await apiFetch('/api/documents/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirementId,
          fileName: file.name,
          fileType: file.type,
        }),
      })
      const presignJson = await presignRes.json()
      if (!presignJson.success) {
        toast('error', presignJson.error?.message ?? '获取上传链接失败')
        return false
      }
      const { presignedUrl, ossKey } = presignJson.data

      // 2. 直传 OSS（XMLHttpRequest 带进度条）
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', presignedUrl)
        xhr.setRequestHeader('Content-Type', file.type)

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100))
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else if (xhr.status === 403) {
            reject(new Error('OSS 上传被拒绝(403)。请检查阿里云 OSS Bucket 的跨域(CORS)设置，允许来源为当前站点域名，允许方法为 PUT/GET/POST'))
          } else {
            reject(new Error(`OSS上传失败: HTTP ${xhr.status} ${xhr.statusText}`))
          }
        }
        xhr.onerror = () => reject(new Error('网络错误，无法连接OSS'))
        xhr.send(file)
      })

      // 3. 确认写库
      const confirmRes = await apiFetch('/api/documents/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirementId,
          ossKey,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        }),
      })
      const confirmJson = await confirmRes.json()
      if (confirmJson.success) {
        toast('success', '上传成功')
        return true
      } else {
        toast('error', confirmJson.error?.message ?? '确认失败')
        return false
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '上传失败'
      toast('error', msg)
      return false
    } finally {
      setUploadingId(null)
      setUploadProgress(null)
      setTargetReqId(null)
    }
  }

  // 文件选择触发
  const handleUploadClick = (requirementId: string) => {
    setTargetReqId(requirementId)
    setClearFirst(false)
    fileInputRef.current?.click()
  }

  // 重新提交触发（先清空旧文件）
  const handleResubmitClick = (requirementId: string) => {
    setTargetReqId(requirementId)
    setClearFirst(true)
    fileInputRef.current?.click()
  }

  // 是否清除旧文件
  const [clearFirst, setClearFirst] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !targetReqId) return

    const fileArray = Array.from(files)
    let successCount = 0
    const shouldClear = clearFirst

    // 逐文件上传，全部完成后统一刷新
    for (let i = 0; i < fileArray.length; i++) {
      const ok = await handleUpload(targetReqId, fileArray[i], shouldClear && i === 0)
      if (ok) successCount++
    }

    if (successCount > 0) {
      onRefresh()
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
    setClearFirst(false)
  }

  // 拍照上传（单文件，直接刷新）
  const handleCameraCapture = async (file: File) => {
    if (!cameraTargetId) return
    const reqId = cameraTargetId
    setCameraTargetId(null)
    const ok = await handleUpload(reqId, file)
    if (ok) onRefresh()
  }

  // 删除文件
  const handleDelete = async (fileId: string) => {
    if (!confirm('确定删除该文件？')) return
    try {
      const res = await apiFetch(`/api/documents/files/${fileId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast('success', '已删除')
        onRefresh()
      } else {
        toast('error', json.error?.message ?? '删除失败')
      }
    } catch {
      toast('error', '删除失败')
    }
  }

  // 统计
  const approved = requirements.filter((r) => r.status === 'APPROVED').length
  const total = requirements.length

  // 分组逻辑
  const showGrouped = applicantCount > 1 && applicants.length > 1
  const groups: Array<{ name: string; items: DocumentRequirement[] }> = showGrouped
    ? (() => {
        const perPerson = Math.ceil(requirements.length / applicants.length)
        return applicants.map((a, i) => ({
          name: a.name,
          items: requirements.slice(i * perPerson, Math.min((i + 1) * perPerson, requirements.length)),
        }))
      })()
    : [{ name: '', items: requirements }]

  const renderRequirement = (req: DocumentRequirement) => {
    const style = STATUS_STYLES[req.status]
    const isUploading = uploadingId === req.id
    const canOperate = canUpload(req.status)

    return (
      <div key={req.id} className={`rounded-xl border border-white/[0.06] p-4 ${style.bg}`}>
        {/* 标题行 */}
          <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${style.dot}`} />
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {req.name}
            </span>
            {req.isRequired && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#B87C7C]/15 text-[#B87C7C]">
                必填
              </span>
            )}
          </div>
          <span className={`text-xs ${style.text}`}>
            {DOC_REQ_STATUS_LABELS[req.status]}
          </span>
        </div>

        {/* 说明文字 */}
        {req.description && (
          <p className="text-xs text-[var(--color-text-secondary)] mb-2 ml-4">
            {req.description}
          </p>
        )}

        {/* 已上传文件列表 */}
        {req.files.length > 0 && (
          <div className="ml-4 space-y-1.5 mb-2">
            {req.files.map((file) => (
              <div key={file.id} className="flex items-center justify-between gap-2">
                <FilePreview
                  fileName={file.fileName}
                  fileType={file.fileType}
                  ossUrl={file.ossUrl}
                  fileSize={file.fileSize}
                  fileId={file.id}
                  rejectReason={(req.status === 'REJECTED' || req.status === 'SUPPLEMENT') ? req.rejectReason : null}
                  compact
                />
                {canOperate ? (
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[#B87C7C] bg-[#B87C7C]/10 hover:bg-[#B87C7C]/20 active:scale-90 transition-all"
                    title="删除文件"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                ) : req.status === 'APPROVED' ? (
                  <span className="shrink-0 text-[10px] text-[var(--color-success)] px-1.5 py-0.5 rounded bg-[var(--color-success)]/10">✓ 已合格</span>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {/* 上传进度 */}
        {isUploading && uploadProgress !== null && (
          <div className="ml-4 mb-2">
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] mb-1">
              <span>上传中... {uploadProgress}%</span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        {canOperate && !isUploading && (
          <div className="ml-4 flex gap-2">
            <button
              onClick={() => handleUploadClick(req.id)}
              className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/25 transition-colors"
            >
              📁 上传
            </button>
            <button
              onClick={() => setCameraTargetId(req.id)}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.06] text-[var(--color-text-secondary)] hover:bg-white/[0.10] transition-colors"
            >
              📷 拍照
            </button>
          </div>
        )}

        {/* 重新提交按钮（仅已驳回/需补充时显示） */}
        {(req.status === 'REJECTED' || req.status === 'SUPPLEMENT') && req.files.length > 0 && !isUploading && (
          <div className="ml-4 flex gap-2 mt-2">
            <button
              onClick={() => handleResubmitClick(req.id)}
              className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-warning)]/15 text-[var(--color-warning)] hover:bg-[var(--color-warning)]/25 transition-colors"
            >
              🔄 重新提交
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 标题 + 进度 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <span>📤</span>
          <span>我需要上传的资料</span>
        </h3>
        <span className="text-xs text-[var(--color-text-secondary)]">
          {approved}/{total} 已合格
        </span>
      </div>

      {/* 需求列表 */}
      {groups.map((group, gi) => (
        <div key={gi}>
          {showGrouped && (
            <div className="flex items-center gap-2 mb-2 mt-3">
              <div className="w-6 h-6 rounded-full bg-[var(--color-primary)]/15 flex items-center justify-center text-xs font-medium text-[var(--color-primary)]">
                {group.name[0]}
              </div>
              <span className="text-xs font-medium text-[var(--color-text-primary)]">
                {group.name}
              </span>
              <span className="text-xs text-[var(--color-text-secondary)]">
                {group.items.filter(r => r.status === 'APPROVED').length}/{group.items.length}
              </span>
            </div>
          )}
          <div className="space-y-2">
            {group.items.map(renderRequirement)}
          </div>
        </div>
      ))}

      {requirements.length === 0 && (
        <div className="text-center py-8 text-sm text-[var(--color-text-secondary)]">
          暂无资料需求，请等待资料员发送清单
        </div>
      )}

      {/* 隐藏文件选择器 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,.heic,.heif,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z,.txt"
      />

      {/* 拍照组件 */}
      {cameraTargetId && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setCameraTargetId(null)}
          frameType="passport"
        />
      )}
    </div>
  )
}
