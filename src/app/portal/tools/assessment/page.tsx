'use client'

import { useState } from 'react'
import { GlassCard } from '@shared/ui/glass-card'
import { Button } from '@shared/ui/button'
import { useToast } from '@shared/ui/toast'
import { apiFetch } from '@shared/lib/api-client'
import { ToolPageHeader } from '@/components/portal/tool-page-header'

interface Question { key: string; label: string; options: { value: string; label: string }[] }

const QUESTIONS: Question[] = [
  { key: 'income', label: '您的月收入水平？', options: [{ value: 'high', label: '月入 2万+' }, { value: 'medium', label: '月入 8千-2万' }, { value: 'low', label: '月入 8千以下' }] },
  { key: 'travelHistory', label: '您的出境记录？', options: [{ value: 'extensive', label: '多次出境（5次+）' }, { value: 'some', label: '有过出境（1-4次）' }, { value: 'none', label: '无出境记录' }] },
  { key: 'employment', label: '您的工作状态？', options: [{ value: 'stable', label: '稳定在职（1年+）' }, { value: 'self-employed', label: '自由职业/创业' }, { value: 'other', label: '学生/退休/其他' }] },
  { key: 'hasProperty', label: '您是否有房产？', options: [{ value: 'yes', label: '有房产' }, { value: 'no', label: '无房产' }] },
]
const COUNTRIES = ['美国', '日本', '申根国家', '英国', '澳大利亚', '加拿大']

export default function AssessmentPage() {
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [country, setCountry] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<{ score: number; level: string; suggestions: string[] } | null>(null)

  const handleAnswer = (key: string, value: string) => {
    setAnswers({ ...answers, [key]: value })
    setTimeout(() => setStep(s => s + 1), 300)
  }

  const handleEvaluate = async () => {
    try {
      const res = await apiFetch('/api/visa-assessments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country, visaType: '旅游', answers }),
      })
      const json = await res.json()
      if (json.success) { setResult({ score: json.data.score, level: json.data.level, suggestions: json.data.suggestions }); setStep(5) }
    } catch { toast('error', '评估失败，请重试') }
  }

  const levelColors: Record<string, string> = { high: 'rgb(127,168,122)', medium: 'rgb(196,169,125)', low: 'rgb(184,124,124)' }
  const levelLabels: Record<string, string> = { high: '通过率较高', medium: '通过率中等', low: '通过率较低' }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <ToolPageHeader
        icon="🔍"
        title="签证评估"
        description="快速评估您的签证通过概率"
      />

      {step === 0 && (
        <div className="space-y-3">
          <p className="mb-4 text-[14px] text-liquid-mist">选择目标国家</p>
          {COUNTRIES.map(c => (
            <GlassCard key={c} intensity="light" hover className="cursor-pointer p-4" onClick={() => { setCountry(c); setStep(1) }}>
              <p className="text-[15px] font-medium text-liquid-deep">🌍 {c}</p>
            </GlassCard>
          ))}
        </div>
      )}

      {step >= 1 && step <= 4 && (
        <div>
          <button onClick={() => setStep(s => Math.max(0, s - 1))} className="mb-4 text-[13px] text-liquid-ocean hover:underline">← 上一步</button>
          <div className="mb-4 flex gap-1">{[1,2,3,4].map(s => <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-liquid-ocean' : 'bg-liquid-ocean/10'}`} />)}</div>
          <p className="mb-2 text-[11px] text-liquid-mist/60">{country} · 旅游签证</p>
          {QUESTIONS[step - 1] && (
            <div>
              <p className="mb-4 text-[16px] font-semibold text-liquid-deep">{QUESTIONS[step - 1].label}</p>
              <div className="space-y-3">
                {QUESTIONS[step - 1].options.map(opt => (
                  <GlassCard key={opt.value} intensity={answers[QUESTIONS[step - 1].key] === opt.value ? 'accent' : 'light'} hover className="cursor-pointer p-4" onClick={() => handleAnswer(QUESTIONS[step - 1].key, opt.value)}>
                    <p className="text-[14px] text-liquid-deep">{opt.label}</p>
                  </GlassCard>
                ))}
              </div>
              {step === 4 && Object.keys(answers).length === 4 && (
                <div className="mt-6"><Button variant="primary" className="w-full" onClick={handleEvaluate}>查看评估结果</Button></div>
              )}
            </div>
          )}
        </div>
      )}

      {step === 5 && result && (
        <div>
          <button onClick={() => { setStep(0); setAnswers({}); setResult(null) }} className="mb-4 text-[13px] text-liquid-ocean hover:underline">← 重新评估</button>
          <GlassCard intensity="medium" className="p-6 text-center">
            <p className="mb-2 text-[13px] text-liquid-mist">{country} · 旅游签证</p>
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4" style={{ borderColor: levelColors[result.level] }}>
              <span className="text-[32px] font-bold" style={{ color: levelColors[result.level] }}>{result.score}</span>
            </div>
            <p className="mb-4 text-[16px] font-semibold" style={{ color: levelColors[result.level] }}>{levelLabels[result.level]}</p>
            <div className="mt-4 space-y-2 text-left">
              <p className="text-[13px] font-semibold text-liquid-deep">建议：</p>
              {result.suggestions.map((s, i) => <p key={i} className="text-[13px] text-liquid-mist">• {s}</p>)}
            </div>
          </GlassCard>
          <div className="mt-4 text-center"><p className="text-[12px] text-liquid-mist/60">* 评估结果仅供参考，实际结果以使馆审批为准</p></div>
        </div>
      )}
    </div>
  )
}
