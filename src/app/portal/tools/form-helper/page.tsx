'use client'

import { useState, useEffect, useCallback } from 'react'
import { GlassCard } from '@shared/ui/glass-card'
import { Button } from '@shared/ui/button'
import { useToast } from '@shared/ui/toast'
import { apiFetch } from '@shared/lib/api-client'
import { ToolPageHeader } from '@/components/portal/tool-page-header'
import { ToolSkeleton } from '@/components/portal/tool-skeleton'
import { ToolEmptyState } from '@/components/portal/tool-empty-state'

interface FormTemplate {
  id: string
  country: string
  visaType: string
  name: string
  fields: { label: string; key: string; type: string; required: boolean; hint?: string }[]
  isSystem: boolean
}

export default function FormHelperPage() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<FormTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<FormTemplate | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiFetch('/api/form-templates')
      const json = await res.json()
      if (json.success) setTemplates(json.data)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  const handleSave = async () => {
    if (!selected) return
    try {
      const filledCount = selected.fields.filter(f => formData[f.key]).length
      const progress = Math.round((filledCount / selected.fields.length) * 100)
      const res = await apiFetch('/api/form-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: selected.id, data: formData, progress }),
      })
      const json = await res.json()
      if (json.success) toast('success', `保存成功 (${progress}%)`)
    } catch { toast('error', '保存失败') }
  }

  const grouped = templates.reduce<Record<string, FormTemplate[]>>((acc, t) => {
    (acc[t.country] ??= []).push(t)
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <ToolPageHeader
        icon="📝"
        title="申请表助手"
        description="签证申请表填写指导，逐步引导"
      />

      {selected ? (
        <div>
          <button onClick={() => setSelected(null)} className="mb-4 text-[13px] text-liquid-ocean hover:underline">← 返回列表</button>
          <GlassCard intensity="medium" className="p-5">
            <h2 className="mb-1 text-[16px] font-semibold text-liquid-deep">{selected.name}</h2>
            <p className="mb-4 text-[12px] text-liquid-mist/60">{selected.country} · {selected.visaType}</p>
            <div className="space-y-4">
              {selected.fields.map(field => (
                <div key={field.key}>
                  <label className="mb-1 block text-[13px] text-liquid-mist">
                    {field.label} {field.required && <span className="text-liquid-ruby">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea className="glass-input w-full resize-none" rows={3} placeholder={field.hint || ''} value={formData[field.key] || ''} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} />
                  ) : (
                    <input className="glass-input w-full" type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} placeholder={field.hint || ''} value={formData[field.key] || ''} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button variant="primary" onClick={handleSave}>保存进度</Button>
            </div>
          </GlassCard>
        </div>
      ) : loading ? (
        <ToolSkeleton count={3} />
      ) : templates.length === 0 ? (
        <ToolEmptyState
          icon="📝"
          title="暂无模板"
          description="管理员发布后将在此显示"
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([country, temps]) => (
            <div key={country}>
              <h3 className="mb-2 text-[14px] font-semibold text-liquid-deep">🌍 {country}</h3>
              <div className="space-y-2">
                {temps.map(t => (
                  <GlassCard key={t.id} intensity="light" hover className="cursor-pointer p-4" onClick={() => { setSelected(t); setFormData({}) }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[14px] font-medium text-liquid-deep">{t.name}</p>
                        <p className="text-[11px] text-liquid-mist/60">{t.fields.length} 个字段</p>
                      </div>
                      <span className="text-[13px] text-liquid-ocean">填写 →</span>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
