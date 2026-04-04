'use client'
import { apiFetch } from '@shared/lib/api-client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { useToast } from '@shared/ui/toast'
import { CameraCapture } from '@shared/ui/camera-capture'
import { DOC_REQ_STATUS_LABELS } from '@erp/types/order'
import type { DocumentRequirement, DocReqStatus, DocumentFile } from '@erp/types/order'
import type { UserRole } from '@shared/types/user'

interface DocumentPanelProps {
  orderId: string
  requirements: DocumentRequirement[]
  userRole: UserRole
  orderStatus: string
  applicantCount?: number
  applicants?: Array<{ id: string; name: string }>
  onRefresh: () => void
}

interface TemplateItem {
  name: string
  description?: string
  required?: boolean
}

interface Template {
  id: string
  name: string
  country: string
  visaType: string
  items: TemplateItem[]
  isSystem: boolean
}

/** 选中项的本地状态（支持修改 required） */
interface SelectableItem extends TemplateItem {
  selected: boolean
}

export function DocumentPanel({ orderId, requirements, userRole, orderStatus: _orderStatus, applicantCount = 1, applicants = [], onRefresh }: DocumentPanelProps) {
  const { toast } = useToast()

  // 内部资料列表（支持本地乐观更新）
  const [localReqs, setLocalReqs] = useState<DocumentRequirement[]>(requirements)
  // 当外部 requirements 变化时同步
  useEffect(() => { setLocalReqs(requirements) }, [requirements])

  // 弹窗开关
  const [showModal, setShowModal] = useState(false)

  // 添加菜单
  const [showAddMenu, setShowAddMenu] = useState(false)
  const addMenuRef = useRef<HTMLDivElement>(null)

  // 手动添加表单
  const [showManualForm, setShowManualForm] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemDesc, setNewItemDesc] = useState('')
  const [newItemRequired, setNewItemRequired] = useState(true)
  const [isAdding, setIsAdding] = useState(false)

  // 模板弹窗
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [selectableItems, setSelectableItems] = useState<SelectableItem[]>([])
  const [isApplying, setIsApplying] = useState(false)

  // 编辑资料
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editRequired, setEditRequired] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // 上传
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [targetReqId, setTargetReqId] = useState<string | null>(null)

  // 审核
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewReason, setReviewReason] = useState('')

  // 拍照
  const [cameraTargetId, setCameraTargetId] = useState<string | null>(null)

  // 文件预览+审核弹窗
  const [previewFile, setPreviewFile] = useState<{
    file: DocumentFile
    requirementId: string
    reqName: string
    reqStatus: DocReqStatus
    rejectReason: string | null
  } | null>(null)
  const [previewReviewing, setPreviewReviewing] = useState(false)
  const [previewReviewReason, setPreviewReviewReason] = useState('')

  // 角色权限
  const canEdit = ['DOC_COLLECTOR', 'VISA_ADMIN', 'COMPANY_OWNER', 'SUPER_ADMIN'].includes(userRole)
  const canReview = ['DOC_COLLECTOR', 'VISA_ADMIN', 'OPERATOR', 'OUTSOURCE'].includes(userRole)
  const canUpload = ['CUSTOMER', 'DOC_COLLECTOR', 'VISA_ADMIN'].includes(userRole)
  const canDeleteFile = ['DOC_COLLECTOR', 'OPERATOR', 'VISA_ADMIN', 'COMPANY_OWNER', 'SUPER_ADMIN'].includes(userRole)

  // 点击外部关闭菜单
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false)
      }
    }
    if (showAddMenu) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showAddMenu])

  // ===== 拉取资料清单（独立于外部 props，支持本地刷新） =====
  const fetchRequirements = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/orders/${orderId}/documents`)
      const json = await res.json()
      if (json.success) {
        setLocalReqs(json.data)
        onRefresh()
      }
    } catch {
      // 静默失败
    }
  }, [orderId, onRefresh])

  // ===== 模板相关 =====
  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true)
    try {
      const res = await apiFetch('/api/templates')
      const json = await res.json()
      if (json.success) setTemplates(json.data)
    } catch {
      toast('error', '加载模板失败')
    } finally {
      setLoadingTemplates(false)
    }
  }, [toast])

  const openTemplateModal = () => {
    setShowAddMenu(false)
    setSelectedTemplate(null)
    setSelectableItems([])
    setShowTemplateModal(true)
    loadTemplates()
  }

  const handleSelectTemplate = (tpl: Template) => {
    setSelectedTemplate(tpl)
    setSelectableItems(tpl.items.map(item => ({
      ...item,
      selected: true,
      required: item.required ?? true,
    })))
  }

  const toggleItem = (index: number) => {
    setSelectableItems(prev => prev.map((item, i) =>
      i === index ? { ...item, selected: !item.selected } : item
    ))
  }

  const toggleRequired = (index: number) => {
    setSelectableItems(prev => prev.map((item, i) =>
      i === index ? { ...item, required: !item.required } : item
    ))
  }

  const toggleSelectAll = () => {
    const allSelected = selectableItems.every(i => i.selected)
    setSelectableItems(prev => prev.map(item => ({ ...item, selected: !allSelected })))
  }

  const handleApplySelected = async () => {
    const chosen = selectableItems.filter(i => i.selected)
    if (chosen.length === 0) {
      toast('error', '请至少选择一项')
      return
    }
    setIsApplying(true)
    try {
      const items = chosen.map(item => ({
        name: item.name,
        description: item.description || undefined,
        isRequired: item.required ?? true,
      }))
      const res = await apiFetch(`/api/orders/${orderId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const json = await res.json()
      if (json.success) {
        toast('success', `已添加 ${items.length} 项资料需求`)
        setShowTemplateModal(false)
        setSelectedTemplate(null)
        await fetchRequirements()
      } else {
        toast('error', json.error?.message ?? '添加失败')
      }
    } catch {
      toast('error', '添加失败')
    } finally {
      setIsApplying(false)
    }
  }

  // ===== 手动添加 =====
  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      toast('error', '请输入资料名称')
      return
    }
    setIsAdding(true)
    try {
      const res = await apiFetch(`/api/orders/${orderId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            name: newItemName.trim(),
            description: newItemDesc.trim() || undefined,
            isRequired: newItemRequired,
          }],
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast('success', '已添加')
        setNewItemName('')
        setNewItemDesc('')
        setShowManualForm(false)
        await fetchRequirements()
      } else {
        toast('error', json.error?.message ?? '添加失败')
      }
    } catch {
      toast('error', '添加失败')
    } finally {
      setIsAdding(false)
    }
  }

  // ===== 编辑资料 =====
  const startEdit = (req: DocumentRequirement) => {
    setEditingId(req.id)
    setEditName(req.name)
    setEditDesc(req.description || '')
    setEditRequired(req.isRequired)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) {
      toast('error', '请输入资料名称')
      return
    }
    setIsSaving(true)
    try {
      const res = await apiFetch(`/api/documents/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim() || undefined,
          isRequired: editRequired,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast('success', '已保存')
        setEditingId(null)
        setLocalReqs(prev => prev.map(r => r.id === editingId ? {
          ...r,
          name: editName.trim(),
          description: editDesc.trim() || null,
          isRequired: editRequired,
        } : r))
        onRefresh()
      } else {
        toast('error', json.error?.message ?? '保存失败')
      }
    } catch {
      toast('error', '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  // ===== 删除资料需求 =====
  const handleDeleteReq = async (reqId: string) => {
    if (!confirm('确定删除该资料需求？已上传的文件也会被删除。')) return
    try {
      const res = await apiFetch(`/api/documents/${reqId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast('success', '已删除')
        setLocalReqs(prev => prev.filter(r => r.id !== reqId))
        onRefresh()
      } else {
        toast('error', json.error?.message ?? '删除失败')
      }
    } catch { toast('error', '删除失败') }
  }

  // ===== 上传 =====
  const handleUploadClick = (requirementId: string) => {
    setTargetReqId(requirementId)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !targetReqId) return
    const fileArray = Array.from(files)
    const MAX_SIZE = 50 * 1024 * 1024
    const oversized = fileArray.filter((f) => f.size > MAX_SIZE)
    if (oversized.length > 0) {
      toast('error', `以下文件超过 50MB 限制: ${oversized.map((f) => f.name).join(', ')}`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setUploadingId(targetReqId)
    setUploadProgress({ current: 0, total: fileArray.length })
    try {
      let successCount = 0
      const CONCURRENCY = 3
      const uploadSingle = async (file: File): Promise<boolean> => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('requirementId', targetReqId!)
        const res = await apiFetch('/api/documents/upload', { method: 'POST', body: formData })
        const json = await res.json()
        if (!json.success) toast('error', `${file.name} 上传失败: ${json.error?.message ?? '未知错误'}`)
        return json.success as boolean
      }
      let completed = 0
      for (let i = 0; i < fileArray.length; i += CONCURRENCY) {
        const batch = fileArray.slice(i, i + CONCURRENCY)
        const results = await Promise.all(batch.map(uploadSingle))
        completed += batch.length
        setUploadProgress({ current: completed, total: fileArray.length })
        successCount += results.filter(Boolean).length
      }
      if (successCount > 0) {
        toast('success', `${successCount} 个文件上传成功`)
        await fetchRequirements()
      }
    } catch {
      toast('error', '上传失败')
    } finally {
      setUploadingId(null)
      setUploadProgress(null)
      setTargetReqId(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleCameraCapture = async (file: File) => {
    if (!cameraTargetId) return
    setUploadingId(cameraTargetId)
    setCameraTargetId(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('requirementId', cameraTargetId)
      const res = await apiFetch('/api/documents/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (json.success) {
        toast('success', '照片上传成功')
        await fetchRequirements()
      } else {
        toast('error', json.error?.message ?? '上传失败')
      }
    } catch {
      toast('error', '上传失败')
    } finally {
      setUploadingId(null)
    }
  }

  const handleFileDelete = async (fileId: string) => {
    if (!confirm('确定删除该文件？')) return
    try {
      const res = await apiFetch(`/api/documents/files/${fileId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) { toast('success', '已删除'); await fetchRequirements() }
      else toast('error', json.error?.message ?? '删除失败')
    } catch { toast('error', '删除失败') }
  }

  // ===== 审核 =====
  const handleReview = async (reqId: string, status: DocReqStatus, reason?: string) => {
    setReviewingId(reqId)
    try {
      const res = await apiFetch(`/api/documents/${reqId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectReason: (status === 'REJECTED' || status === 'SUPPLEMENT') ? (reason || reviewReason) : undefined }),
      })
      const json = await res.json()
      if (json.success) {
        toast('success', '审核完成')
        setReviewingId(null)
        setReviewReason('')
        await fetchRequirements()
      } else {
        toast('error', json.error?.message ?? '审核失败')
      }
    } catch {
      toast('error', '审核失败')
    } finally {
      setReviewingId(null)
    }
  }

  // ===== 预览弹窗审核 =====
  const handlePreviewReview = async (status: DocReqStatus) => {
    if (!previewFile) return
    setPreviewReviewing(true)
    try {
      const res = await apiFetch(`/api/documents/${previewFile.requirementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          rejectReason: (status === 'REJECTED' || status === 'SUPPLEMENT') ? previewReviewReason : undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        const label = status === 'APPROVED' ? '合格' : status === 'REJECTED' ? '已驳回' : '需补充'
        toast('success', label)
        setPreviewFile(null)
        setPreviewReviewReason('')
        await fetchRequirements()
      } else {
        toast('error', json.error?.message ?? '审核失败')
      }
    } catch {
      toast('error', '审核失败')
    } finally {
      setPreviewReviewing(false)
    }
  }

  // ===== 统计 =====
  const approved = localReqs.filter((r) => r.status === 'APPROVED').length
  const total = localReqs.length
  const showGrouped = applicantCount > 1 && applicants.length > 1

  const groupedRequirements = (): Array<{ name: string; items: DocumentRequirement[] }> => {
    if (!showGrouped) return [{ name: '', items: localReqs }]
    const groups: Array<{ name: string; items: DocumentRequirement[] }> = []
    const perPerson = Math.ceil(localReqs.length / applicants.length)
    for (let i = 0; i < applicants.length; i++) {
      const start = i * perPerson
      const end = Math.min(start + perPerson, localReqs.length)
      groups.push({ name: applicants[i].name, items: localReqs.slice(start, end) })
    }
    return groups
  }

  const groups = groupedRequirements()
  const selectedCount = selectableItems.filter(i => i.selected).length

  // ===== 渲染 =====
  return (
    <div>
      {/* 触发按钮 — 资料清单摘要 */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-[var(--color-primary)]/20 hover:bg-white/[0.05] transition-all group text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-secondary)]/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--color-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">资料清单</h3>
              <p className="text-xs text-[var(--color-text-placeholder)] mt-0.5">
                {total > 0 ? `${approved}/${total} 已合格` : '暂无资料需求'}
                {localReqs.filter(r => r.status === 'REJECTED' || r.status === 'SUPPLEMENT').length > 0 && (
                  <span className="text-[var(--color-error)] ml-2">
                    · {localReqs.filter(r => r.status === 'REJECTED' || r.status === 'SUPPLEMENT').length} 项需处理
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* 进度条 */}
            {total > 0 && (
              <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--color-success)] transition-all duration-500"
                  style={{ width: `${(approved / total) * 100}%` }}
                />
              </div>
            )}
            <svg className="w-5 h-5 text-[var(--color-text-placeholder)] group-hover:text-[var(--color-primary-light)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </button>

      {/* ===== 资料清单弹窗 ===== */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-white/10 overflow-hidden animate-scale-in"
            style={{ background: 'rgba(28, 33, 48, 0.97)', backdropFilter: 'blur(40px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">📋 资料清单</h2>
                {total > 0 && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full ${
                    approved === total
                      ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
                      : 'bg-white/5 text-[var(--color-text-placeholder)]'
                  }`}>
                    {approved}/{total} 已合格
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <div className="relative" ref={addMenuRef}>
                    <button
                      onClick={() => setShowAddMenu(!showAddMenu)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary-light)] hover:bg-[var(--color-primary)]/25 transition-colors flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      添加资料
                    </button>
                    {showAddMenu && (
                      <div className="absolute right-0 top-full mt-1 w-44 rounded-xl overflow-hidden z-50 shadow-xl border border-white/10"
                        style={{ background: 'rgba(32, 38, 54, 0.96)', backdropFilter: 'blur(20px)' }}>
                        <button onClick={() => { setShowAddMenu(false); setShowManualForm(true) }}
                          className="w-full px-4 py-2.5 text-left text-sm text-[var(--color-text-primary)] hover:bg-white/5 transition-colors flex items-center gap-2">
                          <svg className="w-4 h-4 text-[var(--color-info)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          手动添加
                        </button>
                        <div className="border-t border-white/5" />
                        <button onClick={openTemplateModal}
                          className="w-full px-4 py-2.5 text-left text-sm text-[var(--color-text-primary)] hover:bg-white/5 transition-colors flex items-center gap-2">
                          <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          从模板添加
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <button onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-placeholder)] hover:text-[var(--color-text-secondary)] hover:bg-white/5 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* 弹窗内容 */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* 手动添加表单 */}
              {showManualForm && (
                <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <input className="glass-input w-full text-sm" placeholder="资料名称（如：护照、照片）"
                    value={newItemName} onChange={(e) => setNewItemName(e.target.value)} />
                  <input className="glass-input w-full text-sm" placeholder="说明（可选，如：有效期6个月以上）"
                    value={newItemDesc} onChange={(e) => setNewItemDesc(e.target.value)} />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                      <input type="checkbox" checked={newItemRequired}
                        onChange={(e) => setNewItemRequired(e.target.checked)}
                        className="accent-[var(--color-primary)]" />
                      必填项
                    </label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowManualForm(false)}
                        className="text-xs px-3 py-1.5 text-[var(--color-text-placeholder)] hover:text-[var(--color-text-secondary)]">取消</button>
                      <button onClick={handleAddItem} disabled={isAdding}
                        className="glass-btn-primary px-3 py-1.5 text-xs font-medium disabled:opacity-50">
                        {isAdding ? '添加中...' : '确定'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 资料列表 */}
              {localReqs.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl block mb-3">📄</span>
                  <p className="text-sm text-[var(--color-text-placeholder)]">暂无资料需求</p>
                  {canEdit && (
                    <p className="text-xs text-[var(--color-text-placeholder)] mt-1">点击上方「添加资料」开始</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {groups.map((group, gi) => {
                    const groupApproved = group.items.filter(r => r.status === 'APPROVED').length
                    const groupTotal = group.items.length
                    return (
                      <div key={gi}>
                        {showGrouped && (
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-[var(--color-text-primary)] flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-[var(--color-primary)]/15 flex items-center justify-center text-[10px] font-bold text-[var(--color-primary-light)]">
                                {group.name[0]}
                              </span>
                              {group.name}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                              groupApproved === groupTotal
                                ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
                                : 'bg-white/5 text-[var(--color-text-placeholder)]'
                            }`}>{groupApproved}/{groupTotal}</span>
                          </div>
                        )}
                        <div className={showGrouped ? 'space-y-2 pl-1' : 'space-y-2'}>
                          {group.items.map((req) => (
                            <DocumentItem
                              key={req.id}
                              req={req}
                              canUpload={canUpload && ['PENDING', 'REJECTED', 'SUPPLEMENT'].includes(req.status)}
                              canReview={canReview && ['UPLOADED', 'REVIEWING'].includes(req.status)}
                              canDeleteFile={canDeleteFile}
                              canEdit={canEdit}
                              isEditing={editingId === req.id}
                              editName={editName} editDesc={editDesc} editRequired={editRequired}
                              isSaving={isSaving}
                              isUploading={uploadingId === req.id}
                              uploadProgress={uploadingId === req.id ? uploadProgress : null}
                              isReviewing={reviewingId === req.id}
                              reviewReason={reviewReason}
                              onEditNameChange={setEditName}
                              onEditDescChange={setEditDesc}
                              onEditRequiredChange={setEditRequired}
                              onStartEdit={() => startEdit(req)}
                              onSaveEdit={handleSaveEdit}
                              onCancelEdit={() => setEditingId(null)}
                              onDeleteReq={() => handleDeleteReq(req.id)}
                              onReviewReasonChange={setReviewReason}
                              onUpload={() => handleUploadClick(req.id)}
                              onCamera={() => setCameraTargetId(req.id)}
                              onApprove={() => handleReview(req.id, 'APPROVED')}
                              onReject={(status) => handleReview(req.id, status)}
                              onDeleteFile={handleFileDelete}
                              onFilePreview={(file) => {
                                setPreviewFile({
                                  file,
                                  requirementId: req.id,
                                  reqName: req.name,
                                  reqStatus: req.status,
                                  rejectReason: req.rejectReason ?? null,
                                })
                                setPreviewReviewReason('')
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* 隐藏的文件输入 */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange}
        accept="image/*,.heic,.heif,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z,.txt" multiple />

      {/* 拍照弹窗 */}
      {cameraTargetId && (
        <CameraCapture onCapture={handleCameraCapture}
          onClose={() => setCameraTargetId(null)} frameType="passport" />
      )}

      {/* ===== 文件预览+审核弹窗 ===== */}
      {previewFile && typeof document !== 'undefined' && createPortal(
        <FilePreviewReviewModal
          fileName={previewFile.file.fileName}
          fileType={previewFile.file.fileType}
          ossUrl={previewFile.file.ossUrl}
          fileSize={previewFile.file.fileSize}
          reqName={previewFile.reqName}
          reqStatus={previewFile.reqStatus}
          rejectReason={previewFile.rejectReason}
          canReview={canReview && ['UPLOADED', 'REVIEWING'].includes(previewFile.reqStatus)}
          reviewReason={previewReviewReason}
          onReviewReasonChange={setPreviewReviewReason}
          onApprove={() => handlePreviewReview('APPROVED')}
          onReject={() => handlePreviewReview('REJECTED')}
          onSupplement={() => handlePreviewReview('SUPPLEMENT')}
          isReviewing={previewReviewing}
          onClose={() => { setPreviewFile(null); setPreviewReviewReason('') }}
        />,
        document.body,
      )}

      {/* ===== 模板选择弹窗 ===== */}
      {showTemplateModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowTemplateModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-white/10 overflow-hidden"
            style={{ background: 'rgba(28, 33, 48, 0.97)', backdropFilter: 'blur(40px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                {selectedTemplate ? `📄 ${selectedTemplate.name}` : '选择模板'}
              </h2>
              <button
                onClick={() => {
                  if (selectedTemplate) { setSelectedTemplate(null); setSelectableItems([]) }
                  else setShowTemplateModal(false)
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-placeholder)] hover:text-[var(--color-text-secondary)] hover:bg-white/5 transition-colors"
              >
                {selectedTemplate ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                )}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {!selectedTemplate ? (
                <>
                  {loadingTemplates ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-6 h-6 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
                      <span className="ml-3 text-sm text-[var(--color-text-secondary)]">加载中...</span>
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <p className="text-sm text-[var(--color-text-placeholder)]">暂无可用模板</p>
                      <a href="/admin/templates" className="inline-block text-xs text-[var(--color-info)] hover:text-[var(--color-primary-light)]">前往模板库创建 →</a>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {templates.map((tpl) => (
                        <button key={tpl.id} onClick={() => handleSelectTemplate(tpl)}
                          className="text-left p-4 rounded-xl border border-white/5 hover:border-[var(--color-primary)]/30 hover:bg-white/[0.03] transition-all group">
                          <h3 className="text-sm font-medium text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-primary-light)]">{tpl.name}</h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-info)]/10 text-[var(--color-info)]">{tpl.country}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)]">{tpl.visaType}</span>
                            <span className="text-[11px] text-[var(--color-text-placeholder)]">{tpl.items.length} 项</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer select-none">
                      <input type="checkbox" checked={selectableItems.length > 0 && selectableItems.every(i => i.selected)} onChange={toggleSelectAll} className="accent-[var(--color-primary)] w-4 h-4" />
                      全选
                    </label>
                    <span className="text-xs text-[var(--color-text-placeholder)]">已选 {selectedCount}/{selectableItems.length}</span>
                  </div>
                  {selectableItems.map((item, index) => (
                    <div key={index} className={`flex items-start gap-3 p-3 rounded-xl transition-all ${item.selected ? 'bg-[var(--color-primary)]/8 border border-[var(--color-primary)]/20' : 'bg-white/[0.02] border border-white/5'}`}>
                      <label className="flex items-center cursor-pointer select-none">
                        <input type="checkbox" checked={item.selected} onChange={() => toggleItem(index)} className="mt-0.5 accent-[var(--color-primary)] w-4 h-4 shrink-0" />
                      </label>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-[var(--color-text-primary)]">{item.name}</span>
                        {item.description && <span className="text-[10px] text-[var(--color-text-placeholder)] ml-2 hidden sm:inline">{item.description}</span>}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); toggleRequired(index) }}
                        className={`text-[10px] px-2 py-0.5 rounded-full transition-colors shrink-0 ${item.required ? 'bg-[var(--color-error)]/15 text-[var(--color-error)]' : 'bg-white/5 text-[var(--color-text-placeholder)]'}`}>
                        {item.required ? '必填' : '选填'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedTemplate && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-white/5">
                <button onClick={() => { setSelectedTemplate(null); setSelectableItems([]) }}
                  className="text-xs px-4 py-2 rounded-lg text-[var(--color-text-placeholder)] hover:text-[var(--color-text-secondary)] hover:bg-white/5 transition-colors">返回模板列表</button>
                <button onClick={handleApplySelected} disabled={isApplying || selectedCount === 0}
                  className="glass-btn-primary px-5 py-2 text-sm font-medium disabled:opacity-50">
                  {isApplying ? '添加中...' : `添加选中项 (${selectedCount})`}
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}

// ==================== 单条资料需求 ====================
function DocumentItem({
  req, canUpload, canReview, canDeleteFile, canEdit, isEditing, editName, editDesc, editRequired,
  isSaving, isUploading, uploadProgress, isReviewing, reviewReason,
  onEditNameChange, onEditDescChange, onEditRequiredChange, onStartEdit, onSaveEdit, onCancelEdit,
  onDeleteReq, onReviewReasonChange, onUpload, onCamera, onApprove, onReject, onDeleteFile, onFilePreview,
}: {
  req: DocumentRequirement
  canUpload: boolean
  canReview: boolean
  canDeleteFile: boolean
  canEdit: boolean
  isEditing: boolean
  editName: string
  editDesc: string
  editRequired: boolean
  isSaving: boolean
  isUploading: boolean
  uploadProgress: { current: number; total: number } | null
  isReviewing: boolean
  reviewReason: string
  onEditNameChange: (v: string) => void
  onEditDescChange: (v: string) => void
  onEditRequiredChange: (v: boolean) => void
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDeleteReq: () => void
  onReviewReasonChange: (v: string) => void
  onUpload: () => void
  onCamera: () => void
  onApprove: () => void
  onReject: (status: 'REJECTED' | 'SUPPLEMENT') => void
  onDeleteFile: (fileId: string) => void
  onFilePreview: (file: DocumentFile) => void
}) {
  const [showReviewForm, setShowReviewForm] = useState(false)

  const statusColor: Record<DocReqStatus, string> = {
    PENDING: 'bg-[var(--color-text-placeholder)]',
    UPLOADED: 'bg-[var(--color-info)]',
    REVIEWING: 'bg-[var(--color-accent)]',
    APPROVED: 'bg-[var(--color-success)]',
    REJECTED: 'bg-[var(--color-error)]',
    SUPPLEMENT: 'bg-[var(--color-warning)]',
  }

  if (isEditing) {
    return (
      <div className="p-3 rounded-xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 space-y-2">
        <input className="glass-input w-full text-sm" placeholder="资料名称" value={editName} onChange={(e) => onEditNameChange(e.target.value)} />
        <input className="glass-input w-full text-sm" placeholder="说明（可选）" value={editDesc} onChange={(e) => onEditDescChange(e.target.value)} />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <input type="checkbox" checked={editRequired} onChange={(e) => onEditRequiredChange(e.target.checked)} className="accent-[var(--color-primary)]" />
            必填项
          </label>
          <div className="flex items-center gap-2">
            <button onClick={onCancelEdit} className="text-xs px-3 py-1.5 text-[var(--color-text-placeholder)] hover:text-[var(--color-text-secondary)]">取消</button>
            <button onClick={onSaveEdit} disabled={isSaving} className="glass-btn-primary px-3 py-1.5 text-xs font-medium disabled:opacity-50">
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 group">
      <div className="flex items-start gap-3">
        <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${statusColor[req.status]}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-[var(--color-text-primary)] font-medium">{req.name}</span>
            {req.isRequired && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-error)]/15 text-[var(--color-error)]">必填</span>}
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[var(--color-text-placeholder)]">
              {DOC_REQ_STATUS_LABELS[req.status]}
            </span>
            {canEdit && (
              <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onStartEdit} className="w-6 h-6 rounded flex items-center justify-center text-[var(--color-text-placeholder)] hover:text-[var(--color-info)] hover:bg-[var(--color-info)]/10 transition-colors" title="编辑">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={onDeleteReq} className="w-6 h-6 rounded flex items-center justify-center text-[var(--color-text-placeholder)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors" title="删除">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            )}
          </div>
          {req.description && <p className="text-xs text-[var(--color-text-secondary)] mt-1">{req.description}</p>}
          {req.rejectReason && <p className="text-xs text-[var(--color-error)] mt-1">驳回原因：{req.rejectReason}</p>}

          {/* 文件列表 — 点击打开预览弹窗 */}
          {req.files.length > 0 && (
            <div className="mt-2 space-y-1">
              {req.files.map((file) => {
                const fileItemProps: { file: DocumentFile; onClick: () => void; onDelete?: () => void } = {
                  file,
                  onClick: () => onFilePreview(file),
                }
                if (canDeleteFile) {
                  fileItemProps.onDelete = () => onDeleteFile(file.id)
                }
                return <FileItemCompact key={file.id} {...fileItemProps} />
              })}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            {canUpload && (
              <>
                <button onClick={onUpload} disabled={isUploading}
                  className="text-xs px-2.5 py-1 rounded-lg bg-[var(--color-info)]/15 text-[var(--color-info)] hover:bg-[var(--color-info)]/25 transition-colors disabled:opacity-50">
                  {isUploading ? (uploadProgress ? `上传中 (${uploadProgress.current}/${uploadProgress.total})...` : '上传中...') : '📁 上传'}
                </button>
                <button onClick={onCamera} disabled={isUploading}
                  className="text-xs px-2.5 py-1 rounded-lg bg-[var(--color-accent)]/15 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/25 transition-colors disabled:opacity-50">
                  📷 拍照
                </button>
              </>
            )}
            {canReview && !showReviewForm && (
              <button onClick={() => setShowReviewForm(true)}
                className="text-xs px-2.5 py-1 rounded-lg bg-[var(--color-accent)]/15 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/25 transition-colors">
                审核
              </button>
            )}
          </div>

          {isUploading && uploadProgress && (
            <div className="mt-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[var(--color-info)] transition-all duration-300"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }} />
              </div>
            </div>
          )}

          {showReviewForm && (
            <div className="mt-2 p-2 rounded-lg bg-white/[0.03] space-y-2">
              <textarea className="glass-input w-full text-xs resize-none" rows={2}
                placeholder="审核意见（驳回时必填）"
                value={reviewReason} onChange={(e) => onReviewReasonChange(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={() => { onApprove(); setShowReviewForm(false) }} disabled={isReviewing}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-success)]/15 text-[var(--color-success)] hover:bg-[var(--color-success)]/25 transition-colors disabled:opacity-50">合格</button>
                <button onClick={() => { onReject('REJECTED'); setShowReviewForm(false) }} disabled={isReviewing}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-error)]/15 text-[var(--color-error)] hover:bg-[var(--color-error)]/25 transition-colors disabled:opacity-50">需修改</button>
                <button onClick={() => { onReject('SUPPLEMENT'); setShowReviewForm(false) }} disabled={isReviewing}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-warning)]/15 text-[var(--color-warning)] hover:bg-[var(--color-warning)]/25 transition-colors disabled:opacity-50">需补充</button>
                <button onClick={() => setShowReviewForm(false)}
                  className="text-xs px-3 py-1.5 text-[var(--color-text-placeholder)] hover:text-[var(--color-text-secondary)]">取消</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== 文件条目（紧凑模式，点击打开预览） ====================
function FileItemCompact({
  file,
  onClick,
  onDelete,
}: {
  file: DocumentFile
  onClick: () => void
  onDelete?: () => void
}) {
  const getFileIcon = () => {
    if (file.fileType.startsWith('image/')) return '🖼️'
    if (file.fileType === 'application/pdf') return '📄'
    if (file.fileType === 'text/plain') return '📝'
    if (file.fileType.includes('word')) return '📃'
    if (file.fileType.includes('excel') || file.fileType.includes('sheet')) return '📊'
    return '📎'
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  return (
    <div className="flex items-center gap-2 text-xs group/file">
      <span className="shrink-0">{getFileIcon()}</span>
      <button
        onClick={onClick}
        className="text-[var(--color-info)] hover:text-[var(--color-primary-light)] truncate max-w-[200px] text-left transition-colors underline-offset-2 hover:underline"
      >
        {file.fileName}
      </button>
      <span className="text-[var(--color-text-placeholder)] shrink-0">({formatSize(file.fileSize)})</span>
      {onDelete && (
        <button onClick={onDelete}
          className="text-[var(--color-error)]/60 hover:text-[var(--color-error)] shrink-0 opacity-0 group-hover/file:opacity-100 transition-all"
          title="删除文件">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      )}
    </div>
  )
}

// ==================== 文件预览+审核弹窗 ====================
function FilePreviewReviewModal({
  fileName, fileType, ossUrl, fileSize,
  reqName, reqStatus, rejectReason,
  canReview, reviewReason, onReviewReasonChange,
  onApprove, onReject, onSupplement, isReviewing, onClose,
}: {
  fileName: string
  fileType: string
  ossUrl: string
  fileSize: number
  reqName: string
  reqStatus: DocReqStatus
  rejectReason?: string | null
  canReview: boolean
  reviewReason: string
  onReviewReasonChange: (v: string) => void
  onApprove: () => void
  onReject: () => void
  onSupplement: () => void
  isReviewing: boolean
  onClose: () => void
}) {
  const isImage = fileType.startsWith('image/')
  const isPdf = fileType === 'application/pdf'
  const isText = fileType === 'text/plain'
  const canPreview = isImage || isPdf || isText

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const statusLabel = DOC_REQ_STATUS_LABELS[reqStatus]
  const statusColorMap: Record<DocReqStatus, string> = {
    PENDING: 'text-[var(--color-text-placeholder)]',
    UPLOADED: 'text-[var(--color-info)]',
    REVIEWING: 'text-[var(--color-accent)]',
    APPROVED: 'text-[var(--color-success)]',
    REJECTED: 'text-[var(--color-error)]',
    SUPPLEMENT: 'text-[var(--color-warning)]',
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 overflow-hidden animate-scale-in"
        style={{ background: 'rgba(28, 33, 48, 0.97)', backdropFilter: 'blur(40px)' }}>

        {/* 顶栏 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`text-xs px-2 py-0.5 rounded-full bg-white/5 ${statusColorMap[reqStatus]}`}>{statusLabel}</span>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-[var(--color-text-primary)] truncate">{reqName}</h3>
              <p className="text-xs text-[var(--color-text-placeholder)] truncate">{fileName} · {formatSize(fileSize)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a href={ossUrl} target="_blank" rel="noopener noreferrer"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all" title="下载">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </a>
            <button onClick={onClose} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* 内容区：左侧预览 + 右侧审核 */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* 左侧：文件预览 */}
          <div className="flex-1 min-h-[300px] md:min-h-0 overflow-auto bg-[#12151f]">
            {isImage && (
              <div className="w-full h-full flex items-center justify-center p-6">
                <Image src={ossUrl} alt={fileName} width={1200} height={900}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg" />
              </div>
            )}
            {isPdf && (
              <iframe src={ossUrl} className="w-full h-full border-0 min-h-[400px]" title={fileName} />
            )}
            {isText && (
              <iframe src={ossUrl} className="w-full h-full border-0 min-h-[400px]" title={fileName} />
            )}
            {!canPreview && (
              <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center gap-4 text-white/60">
                <span className="text-5xl">📎</span>
                <p className="text-sm">此文件类型不支持在线预览</p>
                <a href={ossUrl} target="_blank" rel="noopener noreferrer" className="glass-btn-primary px-4 py-2 text-sm">下载文件</a>
              </div>
            )}
          </div>

          {/* 右侧：审核面板 */}
          {canReview && (
            <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-white/5 p-5 flex flex-col gap-4 overflow-y-auto">
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">审核操作</h4>

              {/* 历史驳回原因 */}
              {rejectReason && (
                <div className="p-3 rounded-xl bg-[var(--color-error)]/8 border border-[var(--color-error)]/15">
                  <span className="text-[10px] text-[var(--color-error)] font-medium">上次驳回原因</span>
                  <p className="text-xs text-[var(--color-text-primary)] mt-1">{rejectReason}</p>
                </div>
              )}

              {/* 审核备注输入 */}
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                  备注 / 驳回理由
                </label>
                <textarea
                  className="glass-input w-full text-sm resize-none"
                  rows={3}
                  placeholder="驳回时必填，合格可留空..."
                  value={reviewReason}
                  onChange={(e) => onReviewReasonChange(e.target.value)}
                />
              </div>

              {/* 操作按钮 */}
              <div className="space-y-2">
                <button onClick={onApprove} disabled={isReviewing}
                  className="w-full py-2.5 rounded-xl text-sm font-medium bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/20 hover:bg-[var(--color-success)]/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  {isReviewing ? '处理中...' : '合格'}
                </button>
                <button onClick={onReject} disabled={isReviewing || !reviewReason.trim()}
                  className="w-full py-2.5 rounded-xl text-sm font-medium bg-[var(--color-error)]/15 text-[var(--color-error)] border border-[var(--color-error)]/20 hover:bg-[var(--color-error)]/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  {isReviewing ? '处理中...' : '驳回（需修改）'}
                </button>
                <button onClick={onSupplement} disabled={isReviewing || !reviewReason.trim()}
                  className="w-full py-2.5 rounded-xl text-sm font-medium bg-[var(--color-warning)]/15 text-[var(--color-warning)] border border-[var(--color-warning)]/20 hover:bg-[var(--color-warning)]/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  {isReviewing ? '处理中...' : '需补充'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
