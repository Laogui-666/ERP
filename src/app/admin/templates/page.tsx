'use client'
import { apiFetch } from '@shared/lib/api-client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@shared/ui/card'
import { PageHeader } from '@shared/components/layout/page-header'
import { useToast } from '@shared/ui/toast'
import { useAuth } from '@shared/hooks/use-auth'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'

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
          <Button
            variant="primary"
            size="md"
            onClick={() => { resetForm(); setShowForm(true) }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建模板
          </Button>
        ) : undefined}
      />

      {showForm && (
        <Card padding="lg">
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold text-glass-primary">
              {editingId ? '编辑模板' : '新建模板'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="模板名称"
                placeholder="如：法国旅游签证材料清单"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
              <Input
                label="国家"
                placeholder="如：法国"
                value={formCountry}
                onChange={(e) => setFormCountry(e.target.value)}
              />
              <Input
                label="签证类型"
                placeholder="如：旅游"
                value={formVisaType}
                onChange={(e) => setFormVisaType(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-glass-muted">资料清单</label>
              {formItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    className="flex-1"
                    placeholder="资料名称"
                    value={item.name}
                    onChange={(e) => updateItem(i, 'name', e.target.value)}
                  />
                  <Input
                    className="flex-1"
                    placeholder="说明（可选）"
                    value={item.description ?? ''}
                    onChange={(e) => updateItem(i, 'description', e.target.value)}
                  />
                  <label className="flex items-center gap-1 text-xs text-glass-muted whitespace-nowrap">
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
                    className="text-glass-error text-sm disabled:opacity-30"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={addItem}
                className="text-xs text-glass-primary hover:text-glass-primary/80 transition-colors"
              >
                + 添加资料项
              </button>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="ghost" size="md" onClick={resetForm}>
                取消
              </Button>
              <Button
                variant="primary"
                size="md"
                isLoading={isSaving}
                onClick={handleSave}
              >
                {isSaving ? '保存中...' : '保存'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-6 h-6 border-2 border-glass-primary/30 border-t-glass-primary rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <Card padding="lg" className="text-center">
          <p className="text-glass-muted">暂无模板</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <Card key={t.id} padding="md">
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-glass-primary/10 flex items-center justify-center text-sm">
                      🌍
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-glass-primary">{t.name}</span>
                        {t.isSystem && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-glass-primary/15 text-glass-primary">系统</span>
                        )}
                      </div>
                      <span className="text-xs text-glass-muted/60">
                        {t.country} · {t.visaType} · {Array.isArray(t.items) ? t.items.length : 0} 项
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                    >
                      {expandedId === t.id ? '收起' : '展开'}
                    </Button>
                    {canManage && !t.isSystem && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(t)}>
                          编辑
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)} className="text-glass-error hover:text-glass-error/80">
                          删除
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {expandedId === t.id && Array.isArray(t.items) && (
                  <div className="mt-4 pl-13 space-y-1.5 border-t border-glass-border pt-3">
                    {t.items.map((item: TemplateItem, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full ${item.required ? 'bg-glass-error' : 'bg-glass-muted/40'}`} />
                        <span className="text-glass-primary">{item.name}</span>
                        {item.description && (
                          <span className="text-glass-muted/60">— {item.description}</span>
                        )}
                        {item.required && <span className="text-glass-error text-[10px]">必填</span>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
