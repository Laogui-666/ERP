'use client'

import { useState, useEffect, useCallback } from 'react'
import { GlassCard } from '@shared/ui/glass-card'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { Modal } from '@shared/ui/modal'
import { useToast } from '@shared/ui/toast'
import { apiFetch } from '@shared/lib/api-client'
import { useAuth } from '@shared/hooks/use-auth'

interface Itinerary {
  id: string
  title: string
  destination: string
  startDate: string | null
  endDate: string | null
  days: unknown[]
  budget: string | null
  createdAt: string
}

export default function ItineraryPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [itineraries, setItineraries] = useState<Itinerary[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', destination: '', startDate: '', endDate: '', budget: '' })

  const fetchItineraries = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiFetch('/api/itineraries?pageSize=20')
      const json = await res.json()
      if (json.success) setItineraries(json.data)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchItineraries() }, [fetchItineraries])

  const handleCreate = async () => {
    if (!form.title || !form.destination) { toast('warning', '请填写标题和目的地'); return }
    try {
      const res = await apiFetch('/api/itineraries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, budget: form.budget ? Number(form.budget) : undefined, days: [{ day: 1, activities: [] }] }),
      })
      const json = await res.json()
      if (json.success) {
        toast('success', '行程创建成功')
        setShowCreate(false)
        setForm({ title: '', destination: '', startDate: '', endDate: '', budget: '' })
        fetchItineraries()
      }
    } catch { toast('error', '创建失败') }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[var(--color-text-primary)]">🗺️ 行程助手</h1>
          <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">智能规划您的旅行行程</p>
        </div>
        {user && <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>+ 新建</Button>}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2].map(i => <GlassCard key={i} intensity="light" className="p-4 animate-pulse"><div className="h-4 w-2/3 rounded bg-white/10 mb-2" /><div className="h-3 w-1/3 rounded bg-white/5" /></GlassCard>)}
        </div>
      ) : itineraries.length === 0 ? (
        <GlassCard intensity="medium" className="flex flex-col items-center gap-3 p-10">
          <span className="text-4xl">🗺️</span>
          <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">开始规划您的行程</p>
          <p className="text-[13px] text-[var(--color-text-secondary)] text-center">创建行程，智能规划每日活动安排</p>
          {user && <Button variant="primary" onClick={() => setShowCreate(true)}>创建第一个行程</Button>}
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {itineraries.map((item, i) => (
            <GlassCard key={item.id} intensity="light" hover className="p-4 animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` } as React.CSSProperties}>
              <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">{item.title}</h3>
              <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">📍 {item.destination}</p>
              <div className="mt-2 flex items-center gap-3 text-[11px] text-[var(--color-text-placeholder)]">
                {item.startDate && <span>🗓 {new Date(item.startDate).toLocaleDateString('zh-CN')}</span>}
                {item.budget && <span>💰 ¥{item.budget}</span>}
                <span>📅 {item.days.length}天</span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="新建行程">
        <div className="space-y-4">
          <Input label="行程标题" placeholder="如：东京5日游" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <Input label="目的地" placeholder="如：日本东京" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="出发日期" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            <Input label="返回日期" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <Input label="预算（元）" type="number" placeholder="可选" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>取消</Button>
            <Button variant="primary" onClick={handleCreate}>创建</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
