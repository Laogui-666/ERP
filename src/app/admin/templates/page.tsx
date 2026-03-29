'use client'
import { apiFetch } from '@/lib/api-client'
import { useEffect, useState, useCallback } from 'react'
import { GlassCard } from '@/components/layout/glass-card'
import { PageHeader } from '@/components/layout/page-header'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/use-auth'

interface TemplateItem {
  name: string
  description?: string
  required: boolean
}

interface Template {
  id: string
  name: string
  country: string
  visaType: string
  items: TemplateItem[]
  isSystem: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export default function TemplatesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // 表单状态
  const [formName, setFormName] = useState('')
  const [formCountry, setFormCountry] = useState('')
  const [formVisaType, setFormVisaType] = useState('')
  const [formItems, setFormItems] = useState<TemplateItem[]>([
    { name: '', description: '', required: true },
  ])
  const [isSaving, setIsSaving] = useState(false)

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await apiFetch('/api/templates')
      const json = await res.json()
      if (json.success) setTemplates(json.data)
    } catch {
      toast('error', '加载模板失败')
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  const resetForm = () => {
    setFormName('')
    setFormCountry('')
    setFormVisaType('')
    setFormItems([{ name: '', description: '', required: true }])
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (t: Template) => {
    setEditingId(t.id)
    setFormName(t.name)
    setFormCountry(t.country)
    setFormVisaType(t.visaType)
    setFormItems(t.items.length > 0 ? t.items : [{ name: '', description: '', required: true }])
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formName || !formCountry || !formVisaType) {
      toast('error', '请填写完整信息')
      return
    }
    const validItems = formItems.filter(i => i.name.trim())
    if (validItems.length === 0) {
      toast('error', '至少添加一项资料')
      return
    }
    setIsSaving(true)
    try {
      const payload = {
        name: formName,
        country: formCountry,
        visaType: formVisaType,
        items: validItems,
      }
      const res = editingId
        ? await apiFetch(`/api/templates/${editingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await apiFetch('/api/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
      const json = await res.json()
      if (json.success) {
        toast('success', editingId ? '模板已更新' : '模板已创建')
        resetForm()
        fetchTemplates()
      } else {
        toast('error', json.error?.message ?? '保存失败')
      }
    } catch {
      toast('error', '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该模板？')) return
    try {
      const res = await apiFetch(`/api/templates/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast('success', '已删除')
        fetchTemplates()
      } else {
        toast('error', json.error?.message ?? '删除失败')
      }
    } catch {
      toast('error', '删除失败')
    }
  }

  const addItem = () => {
    setFormItems([...formItems, { name: '', description: '', required: true }])
  }

  const removeItem = (index: number) => {
    if (formItems.length <= 1) return
    setFormItems(formItems.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof TemplateItem, value: string | boolean) => {
    const updated = [...formItems]
    if (field === 'required') {
      updated[index] = { ...updated[index], required: value as boolean }
    } else if (field === 'name') {
      updated[index] = { ...updated[index], name: value as string }
    } else {
      updated[index] = { ...updated[index], description: value as string }
    }
    setFormItems(updated)
  }

  const canManage = user?.role && ['COMPANY_OWNER', 'VISA_ADMIN', 'DOC_COLLECTOR'].includes(user.role)

  return (
    <div className="space-y-6">
      <PageHeader
        title="签证模板"
        description="管理签证资料清单模板"
        action={canManage ? (
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="glass-btn-primary flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建模板
          </button>
        ) : undefined}
      />

      {/* 创建/编辑表单 */}
      {showForm && (
        <GlassCard className="p-6 animate-fade-in-up space-y-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {editingId ? '编辑模板' : '新建模板'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">模板名称</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="如：法国旅游签证材料清单"
                className="w-full glass-input text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">国家</label>
              <input
                value={formCountry}
                onChange={(e) => setFormCountry(e.target.value)}
                placeholder="如：法国"
                className="w-full glass-input text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">签证类型</label>
              <input
                value={formVisaType}
                onChange={(e) => setFormVisaType(e.target.value)}
                placeholder="如：旅游"
                className="w-full glass-input text-sm"
              />
            </div>
          </div>

          {/* 资料项列表 */}
          <div className="space-y-2">
            <label className="text-xs text-[var(--color-text-secondary)]">资料清单</label>
            {formItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={item.name}
                  onChange={(e) => updateItem(i, 'name', e.target.value)}
                  placeholder="资料名称"
                  className="flex-1 glass-input text-sm"
                />
                <input
                  value={item.description ?? ''}
                  onChange={(e) => updateItem(i, 'description', e.target.value)}
                  placeholder="说明（可选）"
                  className="flex-1 glass-input text-sm"
                />
                <label className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={item.required}
                    onChange={(e) => updateItem(i, 'required', e.target.checked)}
                    className="rounded"
                  />
                  必填
                </label>
                <button
                  onClick={() => removeItem(i)}
                  disabled={formItems.length <= 1}
                  className="text-[var(--color-error)] text-sm disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={addItem}
              className="text-xs text-[var(--color-primary-light)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              + 添加资料项
            </button>
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={resetForm} className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="glass-btn-primary px-6 py-2 text-sm font-medium disabled:opacity-50"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </GlassCard>
      )}

      {/* 模板列表 */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-6 h-6 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <p className="text-[var(--color-text-secondary)]">暂无模板</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <GlassCard key={t.id} className="p-5 animate-fade-in-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-sm">
                    🌍
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--color-text-primary)]">{t.name}</span>
                      {t.isSystem && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-info)]/15 text-[var(--color-info)]">系统</span>
                      )}
                    </div>
                    <span className="text-xs text-[var(--color-text-placeholder)]">
                      {t.country} · {t.visaType} · {Array.isArray(t.items) ? t.items.length : 0} 项
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                    className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-2 py-1 rounded bg-white/5"
                  >
                    {expandedId === t.id ? '收起' : '展开'}
                  </button>
                  {canManage && !t.isSystem && (
                    <>
                      <button onClick={() => handleEdit(t)} className="text-xs text-[var(--color-primary-light)] hover:text-[var(--color-text-primary)] px-2 py-1 rounded bg-white/5">
                        编辑
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="text-xs text-[var(--color-error)] hover:text-[var(--color-error)]/80 px-2 py-1 rounded bg-[var(--color-error)]/10">
                        删除
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 展开的资料项 */}
              {expandedId === t.id && Array.isArray(t.items) && (
                <div className="mt-4 pl-13 space-y-1.5 border-t border-white/5 pt-3">
                  {t.items.map((item: TemplateItem, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.required ? 'bg-[var(--color-error)]' : 'bg-[var(--color-text-placeholder)]'}`} />
                      <span className="text-[var(--color-text-primary)]">{item.name}</span>
                      {item.description && (
                        <span className="text-[var(--color-text-placeholder)]">— {item.description}</span>
                      )}
                      {item.required && <span className="text-[var(--color-error)] text-[10px]">必填</span>}
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
