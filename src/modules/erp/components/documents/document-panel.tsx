'use client'
import { apiFetch } from '@shared/lib/api-client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useToast } from '@shared/ui/toast'
import { CameraCapture } from '@shared/ui/camera-capture'
import { DOC_REQ_STATUS_LABELS } from '@erp/types/order'
import type { DocumentRequirement, DocReqStatus, DocumentFile } from '@erp/types/order'
import type { UserRole } from '@shared/types/user'
import { useAIAnalysis } from '@erp/hooks/use-ai-analysis'
import { ERPButton } from '@shared/ui/erp-button'
import { ERPCard } from '@shared/ui/erp-card'
import { ERPInput, ERPTextarea } from '@shared/ui/erp-input'

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
  const { analyzeDocument, isAnalyzing, analysisResult } = useAIAnalysis()

  // 内部资料列表（支持本地乐观更新）
  const [localReqs, setLocalReqs] = useState<DocumentRequirement[]>(requirements)
  // 跟踪当前 orderId + 防止乐观更新期间被外部 props 覆盖
  const prevOrderIdRef = useRef(orderId)
  const pendingMutationRef = useRef(false)

  useEffect(() => {
    if (prevOrderIdRef.current !== orderId) {
      // 切换了订单 → 用新 props 初始化
      prevOrderIdRef.current = orderId
      pendingMutationRef.current = false
      setLocalReqs(requirements)
    } else if (!pendingMutationRef.current) {
      // 同一订单，外部 props 更新（如父组件 fetchOrder 刷新）→ 同步到本地
      // 排除正在做乐观更新的情况，等 mutation 完成后由 fetchRequirements 同步
      setLocalReqs(requirements)
    }
  }, [orderId, requirements])

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

  // 拍照
  const [cameraTargetId, setCameraTargetId] = useState<string | null>(null)

  // 文件预览弹窗（含审核）
  const [previewFile, setPreviewFile] = useState<{
    file: DocumentFile
    requirementId: string
    reqName: string
    reqStatus: DocReqStatus
    rejectReason: string | null
    reviewStatus: string | null
  } | null>(null)
  const [previewReviewing, setPreviewReviewing] = useState(false)
  const [previewReviewReason, setPreviewReviewReason] = useState('')

  // 审核状态卡片弹窗
  const [reviewHistoryFile, setReviewHistoryFile] = useState<{ file: DocumentFile; rejectReason: string | null } | null>(null)

  // 角色权限（按工作流状态动态调整）
  const canEdit = ['DOC_COLLECTOR', 'VISA_ADMIN', 'COMPANY_OWNER', 'SUPER_ADMIN'].includes(userRole)
  const canReview = ['DOC_COLLECTOR', 'VISA_ADMIN', 'OPERATOR', 'OUTSOURCE'].includes(userRole)
  // 上传：CUSTOMER 只能在 PENDING/REJECTED/SUPPLEMENT 时上传；资料员/操作员在审核阶段可上传
  const canUpload = ['CUSTOMER', 'DOC_COLLECTOR', 'VISA_ADMIN', 'OPERATOR', 'OUTSOURCE'].includes(userRole)
  // 删除：按工作流 — 谁在当前环节谁可以管理文件
  const canDeleteFile = ['CUSTOMER', 'DOC_COLLECTOR', 'OPERATOR', 'OUTSOURCE', 'VISA_ADMIN', 'COMPANY_OWNER', 'SUPER_ADMIN'].includes(userRole)

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
      const res = await apiFetch(`/api/orders/${orderId}/documents?t=${Date.now()}`)
      const json = await res.json()
      if (json.success) {
        setLocalReqs(json.data)
      } else {
        console.error('[DocumentPanel] fetchRequirements failed:', json.error?.message)
        toast('error', '刷新资料列表失败: ' + (json.error?.message ?? '未知错误'))
      }
    } catch (err) {
      console.error('[DocumentPanel] fetchRequirements error:', err)
      toast('error', '网络异常，资料列表刷新失败')
    }
  }, [orderId, toast])

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
    pendingMutationRef.current = true
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
        // 刷新弹窗内列表并同步父组件
        await fetchRequirements()
        onRefresh?.()
      } else {
        toast('error', json.error?.message ?? '添加失败')
      }
    } catch (err) {
      console.error('[DocumentPanel] handleApplySelected error:', err)
      toast('error', '添加失败')
    } finally {
      setIsApplying(false)
      pendingMutationRef.current = false
    }
  }

  // ===== 手动添加 =====
  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      toast('error', '请输入资料名称')
      return
    }
    setIsAdding(true)
    pendingMutationRef.current = true
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
        // 刷新弹窗内列表并同步父组件
        await fetchRequirements()
        onRefresh?.()
      } else {
        toast('error', json.error?.message ?? '添加失败')
      }
    } catch (err) {
      console.error('[DocumentPanel] handleAddItem error:', err)
      toast('error', '添加失败')
    } finally {
      setIsAdding(false)
      pendingMutationRef.current = false
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
    const currentId = editingId // 捕获当前编辑的 ID，避免闭包问题
    setIsSaving(true)
    try {
      const res = await apiFetch(`/api/documents/${currentId}`, {
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
        // 乐观更新本地状态
        setLocalReqs(prev => prev.map(r => r.id === currentId ? {
          ...r,
          name: editName.trim(),
          description: editDesc.trim() || null,
          isRequired: editRequired,
        } : r))
      } else {
        toast('error', json.error?.message ?? '保存失败')
      }
    } catch (err) {
      console.error('[DocumentPanel] handleSaveEdit error:', err)
      toast('error', '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  // ===== 删除资料需求 =====
  const handleDeleteReq = async (reqId: string) => {
    if (!confirm('确定删除该资料需求？已上传的文件也会被删除。')) return
    // 乐观更新：立即移除
    pendingMutationRef.current = true
    setLocalReqs(prev => prev.filter(r => r.id !== reqId))
    try {
      const res = await apiFetch(`/api/documents/${reqId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast('success', '已删除')
        await fetchRequirements()
        onRefresh?.()
      } else {
        toast('error', json.error?.message ?? '删除失败')
        fetchRequirements().catch(() => {})
      }
    } catch (err) {
      console.error('[DocumentPanel] handleDeleteReq error:', err)
      toast('error', '删除失败')
      fetchRequirements().catch(() => {})
    } finally {
      pendingMutationRef.current = false
    }
  }

  // ===== 上传 =====
  const handleUploadClick = (requirementId: string, clearFirst = false) => {
    setTargetReqId(requirementId)
    setClearFirstUpload(clearFirst)
    fileInputRef.current?.click()
  }

  const [clearFirstUpload, setClearFirstUpload] = useState(false)

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

    // 重新提交时先删除旧文件
    if (clearFirstUpload) {
      const req = localReqs.find(r => r.id === targetReqId)
      if (req && req.files.length > 0) {
        for (const f of req.files) {
          try { await apiFetch(`/api/documents/files/${f.id}`, { method: 'DELETE' }) } catch { /* ignore */ }
        }
      }
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
    } catch (err) {
      console.error('[DocumentPanel] handleFileChange error:', err)
      toast('error', '上传失败')
    } finally {
      setUploadingId(null)
      setUploadProgress(null)
      setTargetReqId(null)
      setClearFirstUpload(false)
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
    } catch (err) {
      console.error('[DocumentPanel] handleCameraCapture error:', err)
      toast('error', '上传失败')
    } finally {
      setUploadingId(null)
    }
  }

  const handleFileDelete = async (fileId: string) => {
    if (!confirm('确定删除该文件？')) return
    // 乐观更新：立即从本地状态中移除该文件
    setLocalReqs(prev => prev.map(r => {
      const newFiles = r.files.filter(f => f.id !== fileId)
      if (newFiles.length === r.files.length) return r
      return {
        ...r,
        files: newFiles,
        // 如果文件全部被删除，回退到 PENDING
        status: newFiles.length === 0 ? 'PENDING' as DocReqStatus : r.status,
      }
    }))
    try {
      const res = await apiFetch(`/api/documents/files/${fileId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast('success', '已删除')
        fetchRequirements().catch(() => {})
      } else {
        toast('error', json.error?.message ?? '删除失败')
        fetchRequirements().catch(() => {})
      }
    } catch (err) {
      console.error('[DocumentPanel] handleFileDelete error:', err)
      toast('error', '删除失败')
      fetchRequirements().catch(() => {})
    }
  }

  // ===== AI 分析 =====
  const handleAIAnalyze = async (fileId: string) => {
    await analyzeDocument(fileId, 'quality')
  }

  // ===== 预览弹窗审核 =====
  // 单文件审核 - 更新文件 reviewStatus + 通知父组件刷新
  const handlePreviewReview = async (status: DocReqStatus) => {
    if (!previewFile) return
    setPreviewReviewing(true)
    try {
      const res = await apiFetch(`/api/documents/files/${previewFile.file.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewStatus: status,
          rejectReason: (status === 'REJECTED' || status === 'SUPPLEMENT') ? previewReviewReason : undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        const label = status === 'APPROVED' ? '合格' : status === 'REJECTED' ? '已驳回' : '需补充'
        toast('success', label)
        setPreviewFile(null)
        setPreviewReviewReason('')

        // 乐观更新：立即更新本地文件的 reviewStatus，无需等待 API 刷新
        const reviewRejectReason = (status === 'REJECTED' || status === 'SUPPLEMENT') ? previewReviewReason : null
        setLocalReqs(prev => prev.map(r => ({
          ...r,
          files: r.files.map(f =>
            f.id === previewFile.file.id
              ? { ...f, reviewStatus: status, rejectReason: reviewRejectReason }
              : f
          ),
          // 如果当前需求的文件全部审核通过，同步更新需求状态
          ...(r.id === previewFile.requirementId ? {
            status: (() => {
              const updatedFiles = r.files.map(f =>
                f.id === previewFile.file.id
                  ? { ...f, reviewStatus: status }
                  : f
              )
              const statuses = updatedFiles.map(f => f.reviewStatus || 'PENDING')
              if (statuses.every(s => s === 'APPROVED')) return 'APPROVED' as DocReqStatus
              if (statuses.some(s => s === 'REJECTED')) return 'REJECTED' as DocReqStatus
              if (statuses.some(s => s === 'SUPPLEMENT')) return 'SUPPLEMENT' as DocReqStatus
              if (statuses.some(s => s === 'APPROVED')) return 'REVIEWING' as DocReqStatus
              return r.status
            })(),
            // 不覆盖 requirement 级别的 rejectReason，每个文件有独立的审核原因
          } : {}),
        })))

        // 后台静默拉取服务端最新数据（确保最终一致）
        fetchRequirements().catch(() => {})
      } else {
        toast('error', json.error?.message ?? '审核失败')
      }
    } catch (err) {
      console.error('[DocumentPanel] handlePreviewReview error:', err)
      toast('error', '审核失败')
    } finally {
      setPreviewReviewing(false)
    }
  }

  // ===== 统计 =====
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
        className="w-full p-4 rounded-xl glass-card glass-card-hover transition-all group text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-glass-sm bg-glass-success/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-glass-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-glass-text-primary">资料清单</h3>
              <p className="text-xs text-glass-text-muted mt-0.5">
                {total > 0 ? `${total} 项资料` : '暂无资料需求'}

              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-glass-text-muted group-hover:text-glass-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </button>

      {/* ===== 资料清单弹窗 ===== */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-glass-lg glass-modal glass-modal-animate overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border-light">
              <h2 className="text-base font-semibold text-glass-text-primary">📋 资料清单</h2>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <div className="relative" ref={addMenuRef}>
                    <button
                      onClick={() => setShowAddMenu(!showAddMenu)}
                      className="text-xs px-3 py-1.5 rounded-glass-sm glass-card hover:shadow-glass-medium transition-colors flex items-center gap-1.5 text-glass-primary"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      添加资料
                    </button>
                    {showAddMenu && (
                      <div className="absolute right-0 top-full mt-1 w-44 rounded-glass-sm overflow-hidden z-50 shadow-glass-medium glass-card">
                        <button onClick={() => { setShowAddMenu(false); setShowManualForm(true) }}
                          className="w-full px-4 py-2.5 text-left text-sm text-glass-primary hover:bg-glass-primary/5 transition-colors flex items-center gap-2 glass-button-hover">
                          <svg className="w-4 h-4 text-glass-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          手动添加
                        </button>
                        <div className="border-t border-glass-border-light" />
                        <button onClick={openTemplateModal}
                          className="w-full px-4 py-2.5 text-left text-sm text-glass-primary hover:bg-glass-primary/5 transition-colors flex items-center gap-2 glass-button-hover">
                          <svg className="w-4 h-4 text-glass-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          从模板添加
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <button onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-glass-sm flex items-center justify-center text-glass-text-muted hover:text-glass-text-primary hover:bg-glass-primary/5 transition-all glass-button-hover">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* 弹窗内容 */}
            <div className="flex-1 overflow-y-auto p-5 glass-scrollbar">
              {/* 手动添加表单 */}
              {showManualForm && (
                <ERPCard className="mb-4" title="添加资料需求">
                  <div className="space-y-3">
                    <ERPInput
                      placeholder="资料名称（如：护照、照片）"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      fullWidth
                    />
                    <ERPInput
                      placeholder="说明（可选，如：有效期6个月以上）"
                      value={newItemDesc}
                      onChange={(e) => setNewItemDesc(e.target.value)}
                      fullWidth
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs text-glass-text-muted">
                        <input type="checkbox" checked={newItemRequired}
                          onChange={(e) => setNewItemRequired(e.target.checked)}
                          className="accent-glass-primary" />
                        必填项
                      </label>
                      <div className="flex items-center gap-2">
                        <ERPButton
                          variant="outline"
                          size="sm"
                          onClick={() => setShowManualForm(false)}
                        >
                          取消
                        </ERPButton>
                        <ERPButton
                          size="sm"
                          loading={isAdding}
                          loadingText="添加中..."
                          onClick={handleAddItem}
                          disabled={isAdding}
                        >
                          确定
                        </ERPButton>
                      </div>
                    </div>
                  </div>
                </ERPCard>
              )}

              {/* 资料列表 */}
              {localReqs.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl block mb-3">📄</span>
                  <p className="text-sm text-glass-text-muted">暂无资料需求</p>
                  {canEdit && (
                    <p className="text-xs text-glass-text-muted mt-1">点击上方「添加资料」开始</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {groups.map((group, gi) => {
                    return (
                      <div key={gi}>
                        {showGrouped && (
                          <div className="flex items-center mb-2">
                            <span className="text-xs font-medium text-glass-primary flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-glass-primary/10 flex items-center justify-center text-[10px] font-bold text-glass-primary">
                                {group.name[0]}
                              </span>
                              {group.name}
                            </span>

                          </div>
                        )}
                        <div className={showGrouped ? 'space-y-2 pl-1' : 'space-y-2'}>
                          {group.items.map((req) => (
                            <DocumentItem
                              key={req.id}
                              req={req}
                              canUpload={canUpload && ['PENDING', 'REJECTED', 'SUPPLEMENT'].includes(req.status)}
                              canDeleteFile={canDeleteFile}
                              canEdit={canEdit}
                              isEditing={editingId === req.id}
                              editName={editName} editDesc={editDesc} editRequired={editRequired}
                              isSaving={isSaving}
                              isUploading={uploadingId === req.id}
                              uploadProgress={uploadingId === req.id ? uploadProgress : null}
                              onEditNameChange={setEditName}
                              onEditDescChange={setEditDesc}
                              onEditRequiredChange={setEditRequired}
                              onStartEdit={() => startEdit(req)}
                              onSaveEdit={handleSaveEdit}
                              onCancelEdit={() => setEditingId(null)}
                              onDeleteReq={() => handleDeleteReq(req.id)}
                              onUpload={(clearFirst?: boolean) => handleUploadClick(req.id, !!clearFirst)}
                              onCamera={() => setCameraTargetId(req.id)}
                              onDeleteFile={handleFileDelete}
                              onReviewFileClick={(file) => setReviewHistoryFile({ file, rejectReason: file.rejectReason ?? null })}
                              onFilePreview={(file) => {
                                setPreviewFile({
                                  file,
                                  requirementId: req.id,
                                  reqName: req.name,
                                  reqStatus: req.status,
                                  rejectReason: file.rejectReason ?? null,
                                  reviewStatus: file.reviewStatus ?? null,
                                })
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

      {/* ===== 文件预览弹窗（含审核） ===== */}
      {previewFile && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setPreviewFile(null); setPreviewReviewReason('') }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-glass-lg glass-modal glass-modal-animate overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border-light">
              <h2 className="text-base font-semibold text-glass-text-primary">📄 文件预览</h2>
              <div className="flex items-center gap-2">
                {canReview && (
                  <button 
                    onClick={() => handleAIAnalyze(previewFile.file.id)}
                    disabled={isAnalyzing}
                    className="text-xs px-3 py-1.5 rounded-glass-sm glass-card text-glass-primary hover:shadow-glass-medium transition-colors disabled:opacity-50"
                  >
                    {isAnalyzing ? 'AI 分析中...' : '🤖 AI 分析'}
                  </button>
                )}
                <button onClick={() => { setPreviewFile(null); setPreviewReviewReason('') }}
                  className="w-8 h-8 rounded-glass-sm flex items-center justify-center text-glass-text-muted hover:text-glass-text-primary hover:bg-glass-primary/5 transition-all glass-button-hover">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 glass-scrollbar">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-glass-text-primary mb-2">{previewFile.file.fileName}</h3>
                <div className="flex items-center gap-2 text-xs text-glass-text-muted">
                  <span>类型: {previewFile.file.fileType}</span>
                  <span>大小: {(previewFile.file.fileSize / 1024 / 1024).toFixed(2)}MB</span>
                </div>
              </div>
              
              {/* 显示 AI 分析结果 */}
              {analysisResult && (
                <div className="mt-3 p-3 rounded-glass-sm bg-glass-primary/5 border border-glass-primary/20 mb-4">
                  <h4 className="text-sm font-semibold text-glass-primary mb-2">AI 分析结果</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-glass-text-muted">质量评分：</span>
                      <span className="text-glass-primary font-medium">{analysisResult.score}%</span>
                    </div>
                    {analysisResult.issues && analysisResult.issues.length > 0 && (
                      <div>
                        <span className="text-glass-text-muted block mb-1">发现问题：</span>
                        <ul className="list-disc list-inside space-y-1 text-glass-text-primary">
                          {analysisResult.issues.map((issue: any, index: number) => (
                            <li key={index}>{issue.message}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                      <div>
                        <span className="text-glass-text-muted block mb-1">建议：</span>
                        <ul className="list-disc list-inside space-y-1 text-glass-success">
                          {analysisResult.recommendations.map((rec: string, index: number) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* 文件预览内容 */}
              <div className="border border-glass-border rounded-glass-lg p-4 bg-white/5">
                {previewFile.file.fileType.startsWith('image/') ? (
                  <img 
                    src={previewFile.file.ossUrl} 
                    alt={previewFile.file.fileName}
                    className="max-w-full max-h-[50vh] object-contain"
                  />
                ) : previewFile.file.fileType === 'application/pdf' ? (
                  <div className="text-center py-12">
                    <span className="text-4xl block mb-3">📄</span>
                    <p className="text-sm text-glass-text-muted">PDF 预览功能开发中</p>
                    <a 
                      href={previewFile.file.ossUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs text-glass-primary hover:underline"
                    >
                      点击下载查看
                    </a>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <span className="text-4xl block mb-3">📎</span>
                    <p className="text-sm text-glass-text-muted">不支持的文件类型</p>
                    <a 
                      href={previewFile.file.ossUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs text-glass-primary hover:underline"
                    >
                      点击下载查看
                    </a>
                  </div>
                )}
              </div>
              
              {/* 审核区域 */}
              {canReview && ['UPLOADED', 'REVIEWING', 'APPROVED', 'REJECTED', 'SUPPLEMENT'].includes(previewFile.reqStatus) && (
                <ERPCard className="mt-4" title="审核">
                  {previewFile.rejectReason && (previewFile.reqStatus === 'REJECTED' || previewFile.reqStatus === 'SUPPLEMENT') && (
                    <div className="text-xs text-glass-danger mb-3">
                      上次驳回原因：{previewFile.rejectReason}
                    </div>
                  )}
                  <ERPTextarea
                    value={previewReviewReason}
                    onChange={(e) => setPreviewReviewReason(e.target.value)}
                    placeholder="请输入审核意见（可选）"
                    rows={3}
                    fullWidth
                    className="mb-3"
                  />
                  <div className="flex gap-2">
                    <ERPButton
                      variant="success"
                      size="sm"
                      fullWidth
                      loading={previewReviewing}
                      loadingText="审核中..."
                      onClick={() => handlePreviewReview('APPROVED')}
                      disabled={previewReviewing}
                    >
                      ✅ 合格
                    </ERPButton>
                    <ERPButton
                      variant="danger"
                      size="sm"
                      fullWidth
                      loading={previewReviewing}
                      loadingText="审核中..."
                      onClick={() => handlePreviewReview('REJECTED')}
                      disabled={previewReviewing}
                    >
                      ❌ 驳回
                    </ERPButton>
                    <ERPButton
                      variant="warning"
                      size="sm"
                      fullWidth
                      loading={previewReviewing}
                      loadingText="审核中..."
                      onClick={() => handlePreviewReview('SUPPLEMENT')}
                      disabled={previewReviewing}
                    >
                      ⚠️ 需补充
                    </ERPButton>
                  </div>
                </ERPCard>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* ===== 审核状态卡片弹窗 ===== */}
      {reviewHistoryFile && typeof document !== 'undefined' && createPortal(
        <ReviewHistoryCard
          fileId={reviewHistoryFile.file.id}
          fileName={reviewHistoryFile.file.fileName}
          reviewStatus={reviewHistoryFile.file.reviewStatus}
          rejectReason={reviewHistoryFile.rejectReason}
          onClose={() => setReviewHistoryFile(null)}
        />,
        document.body,
      )}

      {/* ===== 模板选择弹窗 ===== */}
      {showTemplateModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowTemplateModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-glass-lg border border-glass-border glass-modal glass-modal-animate overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-glass-border-light">
              <h2 className="text-base font-semibold text-glass-text-primary">
                {selectedTemplate ? `📄 ${selectedTemplate.name}` : '选择模板'}
              </h2>
              <button
                onClick={() => {
                  if (selectedTemplate) { setSelectedTemplate(null); setSelectableItems([]) }
                  else setShowTemplateModal(false)
                }}
                className="w-8 h-8 rounded-glass-sm flex items-center justify-center text-glass-text-muted hover:text-glass-text-primary hover:bg-glass-primary/5 transition-colors glass-button-hover"
              >
                {selectedTemplate ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                )}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 glass-scrollbar">
              {!selectedTemplate ? (
                <>
                  {loadingTemplates ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-6 h-6 border-2 border-glass-border border-t-glass-primary rounded-full animate-spin" />
                      <span className="ml-3 text-sm text-glass-text-muted">加载中...</span>
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <p className="text-sm text-glass-text-muted">暂无可用模板</p>
                      <a href="/admin/templates" target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-glass-primary hover:text-glass-primary/80 underline underline-offset-2">前往模板库创建 →</a>
                    </div>
                  ) : (
                    <>
                      {/* 模板库入口 */}
                      <a href="/admin/templates" target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-3 rounded-glass-lg border border-dashed border-glass-border hover:border-glass-primary hover:bg-glass-primary/5 transition-all mb-3 group glass-card">
                        <svg className="w-4 h-4 text-glass-text-muted group-hover:text-glass-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-xs text-glass-text-muted group-hover:text-glass-primary transition-colors">管理模板库（创建/编辑/删除模板）</span>
                      </a>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {templates.map((tpl) => (
                        <button key={tpl.id} onClick={() => handleSelectTemplate(tpl)}
                          className="text-left p-4 rounded-glass-lg border border-glass-border hover:border-glass-primary hover:bg-glass-primary/5 transition-all group glass-card glass-card-hover">
                          <h3 className="text-sm font-medium text-glass-text-primary truncate group-hover:text-glass-primary">{tpl.name}</h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-glass-sm bg-glass-primary/10 text-glass-primary">{tpl.country}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-glass-sm bg-glass-primary/10 text-glass-primary">{tpl.visaType}</span>
                            <span className="text-[11px] text-glass-text-muted">{tpl.items.length} 项</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    </>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-glass-border-light">
                    <label className="flex items-center gap-2 text-sm text-glass-text-muted cursor-pointer select-none">
                      <input type="checkbox" checked={selectableItems.length > 0 && selectableItems.every(i => i.selected)} onChange={toggleSelectAll} className="accent-glass-primary w-4 h-4" />
                      全选
                    </label>
                    <span className="text-xs text-glass-text-muted">已选 {selectedCount}/{selectableItems.length}</span>
                  </div>
                  {selectableItems.map((item, index) => (
                    <div key={index} className={`flex items-start gap-3 p-3 rounded-glass-lg transition-all glass-card ${item.selected ? 'bg-glass-primary/8 border border-glass-primary/20' : 'bg-glass-muted/5 border border-glass-border-light'}`}>
                      <label className="flex items-center cursor-pointer select-none">
                        <input type="checkbox" checked={item.selected} onChange={() => toggleItem(index)} className="mt-0.5 accent-glass-primary w-4 h-4 shrink-0" />
                      </label>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-glass-text-primary">{item.name}</span>
                        {item.description && <span className="text-[10px] text-glass-text-muted ml-2 hidden sm:inline">{item.description}</span>}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); toggleRequired(index) }}
                        className={`text-[10px] px-2 py-0.5 rounded-full transition-colors shrink-0 glass-button-hover ${item.required ? 'bg-glass-danger/15 text-glass-danger' : 'bg-glass-muted/10 text-glass-text-muted'}`}>
                        {item.required ? '必填' : '选填'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedTemplate && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-glass-border-light">
                <button onClick={() => { setSelectedTemplate(null); setSelectableItems([]) }}
                  className="text-xs px-4 py-2 rounded-glass-sm text-glass-text-muted hover:text-glass-text-primary hover:bg-glass-primary/5 transition-colors glass-button-hover">返回模板列表</button>
                <button onClick={handleApplySelected} disabled={isApplying || selectedCount === 0}
                  className="glass-button glass-button-hover text-white px-5 py-2 text-sm font-medium disabled:opacity-50">
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
  req, canUpload, canDeleteFile, canEdit, isEditing, editName, editDesc, editRequired,
  isSaving, isUploading, uploadProgress,
  onEditNameChange, onEditDescChange, onEditRequiredChange, onStartEdit, onSaveEdit, onCancelEdit,
  onDeleteReq, onUpload, onCamera, onDeleteFile, onFilePreview, onReviewFileClick,
}: {
  req: DocumentRequirement
  canUpload: boolean
  canDeleteFile: boolean
  canEdit: boolean
  isEditing: boolean
  editName: string
  editDesc: string
  editRequired: boolean
  isSaving: boolean
  isUploading: boolean
  uploadProgress: { current: number; total: number } | null
  onEditNameChange: (v: string) => void
  onEditDescChange: (v: string) => void
  onEditRequiredChange: (v: boolean) => void
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDeleteReq: () => void
  onUpload: (clearFirst?: boolean) => void
  onCamera: () => void
  onDeleteFile: (fileId: string) => void
  onFilePreview: (file: DocumentFile) => void
  onReviewFileClick?: (file: DocumentFile) => void
}) {
  const statusColor: Record<DocReqStatus, string> = {
    PENDING: 'bg-glass-muted',
    UPLOADED: 'bg-glass-primary',
    REVIEWING: 'bg-glass-primary',
    APPROVED: 'bg-glass-success',
    REJECTED: 'bg-glass-danger',
    SUPPLEMENT: 'bg-glass-warning',
  }

  if (isEditing) {
    return (
      <ERPCard>
        <div className="space-y-3">
          <ERPInput
            placeholder="资料名称"
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            fullWidth
          />
          <ERPInput
            placeholder="说明（可选）"
            value={editDesc}
            onChange={(e) => onEditDescChange(e.target.value)}
            fullWidth
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-glass-text-muted">
              <input type="checkbox" checked={editRequired}
                onChange={(e) => onEditRequiredChange(e.target.checked)}
                className="accent-glass-primary" />
              必填项
            </label>
            <div className="flex items-center gap-2">
              <ERPButton
                variant="outline"
                size="sm"
                onClick={onCancelEdit}
              >
                取消
              </ERPButton>
              <ERPButton
                size="sm"
                loading={isSaving}
                loadingText="保存中..."
                onClick={onSaveEdit}
                disabled={isSaving}
              >
                保存
              </ERPButton>
            </div>
          </div>
        </div>
      </ERPCard>
    )
  }

  return (
    <ERPCard className="group">
      <div className="flex items-start gap-3">
        <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${statusColor[req.status]}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-glass-text-primary font-medium">{req.name}</span>
            {req.isRequired && <span className="text-[10px] px-1.5 py-0.5 rounded-glass-sm bg-glass-danger/15 text-glass-danger">必填</span>}
            <span className="text-[10px] px-1.5 py-0.5 rounded-glass-sm bg-glass-primary/10 text-glass-text-muted">
              {DOC_REQ_STATUS_LABELS[req.status]}
            </span>
            {canEdit && (
              <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onStartEdit} className="w-6 h-6 rounded-glass-sm flex items-center justify-center text-glass-text-muted hover:text-glass-primary hover:bg-glass-primary/10 transition-colors glass-button-hover" title="编辑">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={onDeleteReq} className="w-6 h-6 rounded-glass-sm flex items-center justify-center text-glass-text-muted hover:text-glass-danger hover:bg-glass-danger/10 transition-colors glass-button-hover" title="删除">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            )}
          </div>
          {req.description && <p className="text-xs text-glass-text-muted mt-1">{req.description}</p>}
          {req.rejectReason && (req.status === 'REJECTED' || req.status === 'SUPPLEMENT') && <p className="text-xs text-glass-danger mt-1">驳回原因：{req.rejectReason}</p>}

          {/* 文件列表 — 点击打开预览弹窗 */}
          {req.files.length > 0 && (
            <div className="mt-2 space-y-1">
              {req.files.map((file) => {
                const fileItemProps: { file: DocumentFile; reqStatus: DocReqStatus; rejectReason?: string | null; onClick: () => void; onDelete?: () => void; onReupload?: () => void; onReviewClick?: (file: DocumentFile) => void } = {
                  file,
                  reqStatus: req.status,
                  rejectReason: file.rejectReason, // 使用文件级别的驳回原因，不 fallback 到 requirement 级别
                  onClick: () => onFilePreview(file),
                  onReviewClick: (f: DocumentFile) => onReviewFileClick?.(f),
                }
                // 删除权限：当前环节的负责人可删除
                if (canDeleteFile) {
                  fileItemProps.onDelete = () => onDeleteFile(file.id)
                }
                // 重新上传：被驳回时可重新提交（先删旧文件再上传）
                if (canUpload && ['REJECTED', 'SUPPLEMENT'].includes(req.status)) {
                  fileItemProps.onReupload = () => onUpload(true)
                }
                return <FileItemCompact key={file.id} {...fileItemProps} />
              })}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            {canUpload && (
              <>
                <ERPButton
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                  onClick={() => onUpload()}
                >
                  {isUploading ? (uploadProgress ? `上传中 (${uploadProgress.current}/${uploadProgress.total})...` : '上传中...') : '📁 上传'}
                </ERPButton>
                <ERPButton
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                  onClick={onCamera}
                >
                  📷 拍照
                </ERPButton>
              </>
            )}
          </div>

          {isUploading && uploadProgress && (
            <div className="mt-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-glass-primary transition-all duration-300"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </ERPCard>
  )
}

// ==================== 文件条目（紧凑模式，点击打开预览） ====================
function FileItemCompact({
  file, reqStatus, rejectReason,
  onClick, onDelete, onReupload, onReviewClick,
}: {
  file: DocumentFile
  reqStatus: DocReqStatus
  rejectReason?: string | null
  onClick: () => void
  onDelete?: () => void
  onReupload?: () => void
  onReviewClick?: (file: DocumentFile) => void
}) {
  const getFileIcon = () => {
    if (file.fileType.startsWith('image/')) return '🖼️'
    if (file.fileType === 'application/pdf') return '📄'
    if (file.fileType === 'text/plain') return '📝'
    if (file.fileType.includes('word') || file.fileType.includes('document') || file.fileName.endsWith('.doc') || file.fileName.endsWith('.docx')) return '📃'
    if (file.fileType.includes('excel') || file.fileType.includes('sheet') || file.fileName.endsWith('.xls') || file.fileName.endsWith('.xlsx')) return '📊'
    if (file.fileType.includes('presentation') || file.fileName.endsWith('.ppt') || file.fileName.endsWith('.pptx')) return '📑'
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
        className="text-glass-primary hover:text-glass-primary/80 truncate max-w-[180px] text-left transition-colors underline-offset-2 hover:underline"
      >
        {file.fileName}
      </button>
      <span className="text-glass-text-muted shrink-0">({formatSize(file.fileSize)})</span>
      {/* 文件级审核状态 - 可点击查看审核状态 */}
      {file.reviewStatus === 'APPROVED' && (
        <button onClick={(e) => { e.stopPropagation(); onReviewClick?.(file) }}
          className="text-[10px] text-glass-success shrink-0 px-1.5 py-0.5 rounded-glass-sm bg-glass-success/10 hover:bg-glass-success/20 transition-colors cursor-pointer glass-button-hover">
          ✓ 合格
        </button>
      )}
      {file.reviewStatus === 'REJECTED' && (
        <button onClick={(e) => { e.stopPropagation(); onReviewClick?.(file) }}
          className="text-[10px] text-glass-danger shrink-0 px-1.5 py-0.5 rounded-glass-sm bg-glass-danger/10 hover:bg-glass-danger/20 transition-colors cursor-pointer glass-button-hover">
          ✗ 驳回
        </button>
      )}
      {file.reviewStatus === 'SUPPLEMENT' && (
        <button onClick={(e) => { e.stopPropagation(); onReviewClick?.(file) }}
          className="text-[10px] text-glass-warning shrink-0 px-1.5 py-0.5 rounded-glass-sm bg-glass-warning/10 hover:bg-glass-warning/20 transition-colors cursor-pointer glass-button-hover">
          需补充
        </button>
      )}
      {(!file.reviewStatus || file.reviewStatus === 'PENDING') && (
        <button onClick={(e) => { e.stopPropagation(); onReviewClick?.(file) }}
          className="text-[10px] text-glass-text-muted shrink-0 px-1.5 py-0.5 rounded-glass-sm bg-glass-muted/10 hover:bg-glass-muted/20 transition-colors cursor-pointer glass-button-hover">
          待审核
        </button>
      )}
      {/* 驳回原因 */}
      {rejectReason && (reqStatus === 'REJECTED' || reqStatus === 'SUPPLEMENT') && (
        <span className="text-[10px] text-glass-danger truncate max-w-[120px]" title={rejectReason}>
          {rejectReason}
        </span>
      )}
      {/* 重新提交按钮 */}
      {onReupload && (
        <button onClick={onReupload}
          className="text-glass-warning hover:text-glass-warning/80 shrink-0 text-[10px] px-1.5 py-0.5 rounded-glass-sm bg-glass-warning/10 hover:bg-glass-warning/20 transition-all glass-button-hover"
          title="重新上传">
          重新提交
        </button>
      )}
      {/* 删除按钮 */}
      {onDelete && (
        <button onClick={onDelete}
          className="text-glass-danger/60 hover:text-glass-danger shrink-0 opacity-0 group-hover/file:opacity-100 transition-all glass-button-hover"
          title="删除文件">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      )}
    </div>
  )
}

// ==================== 审核状态卡片（仅显示当前状态及原因，无历史记录） ====================
function ReviewHistoryCard({
  fileId: _fileId, fileName, reviewStatus, rejectReason, onClose,
}: {
  fileId: string
  fileName: string
  reviewStatus: string | null | undefined
  rejectReason?: string | null
  onClose: () => void
}) {
  const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: string; desc: string }> = {
    APPROVED: { label: '合格', color: 'text-glass-success', bg: 'bg-glass-success/15', border: 'border-glass-success/20', icon: '✓', desc: '该资料已通过审核' },
    REJECTED: { label: '已驳回', color: 'text-glass-danger', bg: 'bg-glass-danger/15', border: 'border-glass-danger/20', icon: '✗', desc: '该资料未通过审核，请根据原因重新提交' },
    SUPPLEMENT: { label: '需补充', color: 'text-glass-warning', bg: 'bg-glass-warning/15', border: 'border-glass-warning/20', icon: '⚠', desc: '该资料需要补充材料' },
    PENDING: { label: '待审核', color: 'text-glass-text-muted', bg: 'bg-glass-muted/10', border: 'border-glass-muted/20', icon: '⏳', desc: '该资料尚未审核' },
  }
  const s = statusConfig[reviewStatus || 'PENDING'] || statusConfig.PENDING

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-glass-lg border border-glass-border glass-modal glass-modal-animate overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-glass-border-light">
          <h3 className="text-sm font-semibold text-glass-text-primary truncate">{fileName}</h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-glass-sm flex items-center justify-center text-glass-text-muted hover:text-glass-text-primary hover:bg-glass-primary/5 transition-colors glass-button-hover shrink-0 ml-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* 仅显示当前状态及原因 */}
        <div className="p-5 space-y-4">
          {/* 状态标识 */}
          <div className={`p-4 rounded-glass-lg ${s.bg} border ${s.border} text-center glass-card`}>
            <span className={`text-2xl font-bold ${s.color}`}>{s.icon}</span>
            <p className={`text-sm font-semibold ${s.color} mt-1`}>{s.label}</p>
            <p className="text-xs text-glass-text-muted mt-1">{s.desc}</p>
          </div>

          {/* 驳回/补充原因 */}
          {rejectReason && (reviewStatus === 'REJECTED' || reviewStatus === 'SUPPLEMENT') && (
            <div className="p-3 rounded-glass-sm bg-glass-muted/5 border border-glass-border-light glass-card">
              <span className="text-[10px] uppercase tracking-wide text-glass-text-muted font-medium">
                {reviewStatus === 'REJECTED' ? '驳回原因' : '补充说明'}
              </span>
              <p className="text-sm text-glass-text-primary mt-1.5 leading-relaxed">{rejectReason}</p>
            </div>
          )}

          {/* 待审核提示 */}
          {(!reviewStatus || reviewStatus === 'PENDING') && (
            <p className="text-xs text-glass-text-muted text-center">等待审核员处理</p>
          )}
        </div>
      </div>
    </div>
  )
}


