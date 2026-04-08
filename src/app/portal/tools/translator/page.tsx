'use client'

import { useState, useEffect, useCallback } from 'react'
import { GlassCard } from '@shared/ui/glass-card'
import { Button } from '@shared/ui/button'
import { useToast } from '@shared/ui/toast'
import { apiFetch } from '@shared/lib/api-client'
import { useAuth } from '@shared/hooks/use-auth'
import { ToolPageHeader } from '@/components/portal/tool-page-header'
import { ToolSkeleton } from '@/components/portal/tool-skeleton'
import { ToolEmptyState } from '@/components/portal/tool-empty-state'

interface Translation { id: string; sourceLang: string; targetLang: string; docType: string; resultText: string | null; status: string; createdAt: string }

const LANGS = [{ code: 'zh', label: '中文' }, { code: 'en', label: '英文' }, { code: 'ja', label: '日文' }, { code: 'fr', label: '法文' }, { code: 'de', label: '德文' }, { code: 'ko', label: '韩文' }]
const DOC_TYPES = ['护照', '身份证', '在职证明', '银行流水', '邀请函', '其他']

export default function TranslatorPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [records, setRecords] = useState<Translation[]>([])
  const [loading, setLoading] = useState(true)
  const [sourceLang, setSourceLang] = useState('zh')
  const [targetLang, setTargetLang] = useState('en')
  const [docType, setDocType] = useState('护照')
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchRecords = useCallback(async () => {
    try { setLoading(true); const res = await apiFetch('/api/translations'); const json = await res.json(); if (json.success) setRecords(json.data) }
    catch { /* silent */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { if (user) fetchRecords() }, [user, fetchRecords])

  const handleTranslate = async () => {
    if (!text.trim()) { toast('warning', '请输入要翻译的内容'); return }
    try {
      setSubmitting(true)
      const res = await apiFetch('/api/translations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sourceLang, targetLang, docType, text }) })
      const json = await res.json()
      if (json.success) { toast('success', '翻译完成'); setText(''); fetchRecords() }
    } catch { toast('error', '翻译失败') } finally { setSubmitting(false) }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <ToolPageHeader
        icon="🌐"
        title="翻译助手"
        description="证件、文件多语言翻译"
      />

      <GlassCard intensity="medium" className="mb-6 p-5">
        <div className="mb-4 flex items-center gap-3">
          <select className="glass-input flex-1" value={sourceLang} onChange={e => setSourceLang(e.target.value)}>{LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}</select>
          <span className="text-liquid-mist">→</span>
          <select className="glass-input flex-1" value={targetLang} onChange={e => setTargetLang(e.target.value)}>{LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}</select>
        </div>
        <div className="mb-3"><select className="glass-input w-full" value={docType} onChange={e => setDocType(e.target.value)}>{DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
        <textarea className="glass-input mb-4 w-full resize-none" rows={4} placeholder="输入要翻译的内容..." value={text} onChange={e => setText(e.target.value)} />
        <Button variant="primary" className="w-full" onClick={handleTranslate} isLoading={submitting}>翻译</Button>
      </GlassCard>

      <h2 className="mb-3 text-[16px] font-semibold text-liquid-deep">翻译记录</h2>
      {!user ? (
        <ToolEmptyState
          icon="🔒"
          title="请先登录"
          description="登录后可查看翻译记录"
        />
      ) : loading ? (
        <ToolSkeleton count={2} />
      ) : records.length === 0 ? (
        <ToolEmptyState
          icon="🌐"
          title="暂无翻译记录"
          description="开始翻译，记录将在此显示"
        />
      ) : (
        <div className="space-y-3">
          {records.map((r, i) => (
            <GlassCard key={r.id} intensity="light" className="p-4 animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` } as React.CSSProperties}>
              <div className="mb-1 flex items-center gap-2 text-[11px] text-liquid-mist/60">
                <span>{LANGS.find(l => l.code === r.sourceLang)?.label} → {LANGS.find(l => l.code === r.targetLang)?.label}</span><span>·</span><span>{r.docType}</span>
                <span className={`ml-auto rounded-full px-2 py-0.5 ${r.status === 'completed' ? 'bg-liquid-emerald/15 text-liquid-emerald' : 'bg-liquid-amber/15 text-liquid-amber'}`}>{r.status === 'completed' ? '已完成' : '处理中'}</span>
              </div>
              {r.resultText && <p className="text-[13px] text-liquid-deep">{r.resultText}</p>}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
