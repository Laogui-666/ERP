'use client'

import { useState, useEffect, useCallback } from 'react'
import { GlassCard } from '@shared/ui/glass-card'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { useToast } from '@shared/ui/toast'
import { apiFetch } from '@shared/lib/api-client'
import { useAuth } from '@shared/hooks/use-auth'

interface DocTemplate { id: string; name: string; type: string; language: string; fields: { label: string; key: string; type: string; required: boolean }[]; isSystem: boolean }

const TYPE_LABELS: Record<string, string> = { employment: '在职证明', income: '收入证明', invitation: '邀请函', leave: '准假证明', other: '其他' }

export default function DocumentsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<DocTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<DocTemplate | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [result, setResult] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    try { setLoading(true); const res = await apiFetch('/api/doc-helper'); const json = await res.json(); if (json.success) setTemplates(json.data) }
    catch { /* silent */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { if (user) fetchTemplates() }, [user, fetchTemplates])

  const handleGenerate = async () => {
    if (!selected) return
    try {
      const res = await apiFetch('/api/doc-helper', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ templateId: selected.id, data: formData }) })
      const json = await res.json()
      if (json.success) { setResult(json.data.renderedContent); toast('success', '文档生成成功') }
    } catch { toast('error', '生成失败') }
  }

  const grouped = templates.reduce<Record<string, DocTemplate[]>>((acc, t) => { (acc[t.type] ??= []).push(t); return acc }, {})

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-2 text-[22px] font-bold text-[var(--color-text-primary)]">📄 证明文件</h1>
      <p className="mb-6 text-[13px] text-[var(--color-text-secondary)]">在职/收入证明等常用模板一键生成</p>

      {!user ? (
        <GlassCard intensity="medium" className="flex flex-col items-center gap-3 p-10">
          <span className="text-4xl">🔒</span><p className="text-[14px] font-semibold text-[var(--color-text-primary)]">请先登录</p>
          <p className="text-[13px] text-[var(--color-text-secondary)]">登录后可使用证明文件生成服务</p>
        </GlassCard>
      ) : result ? (
        <div>
          <button onClick={() => { setResult(null); setSelected(null) }} className="mb-4 text-[13px] text-[var(--color-primary)] hover:underline">← 返回</button>
          <GlassCard intensity="medium" className="p-5">
            <h2 className="mb-4 text-[16px] font-semibold text-[var(--color-text-primary)]">生成结果</h2>
            <div className="whitespace-pre-wrap rounded-lg bg-white/5 p-4 text-[14px] leading-relaxed text-[var(--color-text-primary)]">{result}</div>
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => { setResult(null); setSelected(null) }}>重新生成</Button>
              <Button variant="primary" onClick={() => { navigator.clipboard.writeText(result); toast('success', '已复制到剪贴板') }}>复制内容</Button>
            </div>
          </GlassCard>
        </div>
      ) : selected ? (
        <div>
          <button onClick={() => setSelected(null)} className="mb-4 text-[13px] text-[var(--color-primary)] hover:underline">← 返回列表</button>
          <GlassCard intensity="medium" className="p-5">
            <h2 className="mb-1 text-[16px] font-semibold text-[var(--color-text-primary)]">{selected.name}</h2>
            <p className="mb-4 text-[12px] text-[var(--color-text-placeholder)]">{TYPE_LABELS[selected.type] || selected.type} · {selected.language === 'zh' ? '中文' : '英文'}</p>
            <div className="space-y-4">
              {selected.fields.map(field => (
                <Input key={field.key} label={field.label + (field.required ? ' *' : '')} placeholder={`请输入${field.label}`} value={formData[field.key] || ''} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} />
              ))}
            </div>
            <div className="mt-6 flex justify-end"><Button variant="primary" onClick={handleGenerate}>生成文档</Button></div>
          </GlassCard>
        </div>
      ) : loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <GlassCard key={i} intensity="light" className="p-4 animate-pulse"><div className="h-4 w-1/2 rounded bg-white/10" /></GlassCard>)}</div>
      ) : templates.length === 0 ? (
        <GlassCard intensity="medium" className="flex flex-col items-center gap-3 p-10">
          <span className="text-4xl">📄</span><p className="text-[14px] font-semibold text-[var(--color-text-primary)]">暂无模板</p>
          <p className="text-[13px] text-[var(--color-text-secondary)]">管理员发布后将在此显示</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([type, temps]) => (
            <div key={type}>
              <h3 className="mb-2 text-[14px] font-semibold text-[var(--color-text-primary)]">{TYPE_LABELS[type] || type}</h3>
              <div className="space-y-2">
                {temps.map(t => (
                  <GlassCard key={t.id} intensity="light" hover className="cursor-pointer p-4" onClick={() => { setSelected(t); setFormData({}); setResult(null) }}>
                    <div className="flex items-center justify-between">
                      <div><p className="text-[14px] font-medium text-[var(--color-text-primary)]">{t.name}</p><p className="text-[11px] text-[var(--color-text-placeholder)]">{t.language === 'zh' ? '中文' : '英文'} · {t.fields.length} 个字段</p></div>
                      <span className="text-[13px] text-[var(--color-primary)]">生成 →</span>
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
