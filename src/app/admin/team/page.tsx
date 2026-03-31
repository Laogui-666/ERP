'use client'
import { apiFetch } from '@shared/lib/api-client'
import { useEffect, useState, useCallback } from 'react'
import { GlassCard } from '@shared/ui/glass-card'
import { PageHeader } from '@shared/components/layout/page-header'
import { useToast } from '@shared/ui/toast'
import { useAuth } from '@shared/hooks/use-auth'

interface Employee {
  id: string
  username: string
  realName: string
  phone: string
  email: string | null
  role: string
  status: string
  departmentId: string | null
  createdAt: string
}

interface Department {
  id: string
  name: string
  code: string
}

const ROLE_LABELS: Record<string, string> = {
  CS_ADMIN: '客服部管理员',
  CUSTOMER_SERVICE: '客服',
  VISA_ADMIN: '签证部管理员',
  DOC_COLLECTOR: '资料员',
  OPERATOR: '签证操作员',
  OUTSOURCE: '外包业务员',
}

export default function TeamPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // 表单
  const [formUsername, setFormUsername] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formRealName, setFormRealName] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formRole, setFormRole] = useState('CUSTOMER_SERVICE')
  const [formDepartmentId, setFormDepartmentId] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [usersRes, deptsRes] = await Promise.all([
        apiFetch('/api/users'),
        apiFetch('/api/departments'),
      ])
      const [usersJson, deptsJson] = await Promise.all([usersRes.json(), deptsRes.json()])
      if (usersJson.success) setEmployees(usersJson.data)
      if (deptsJson.success) setDepartments(deptsJson.data)
    } catch {
      toast('error', '加载数据失败')
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchData() }, [fetchData])

  const resetForm = () => {
    setFormUsername('')
    setFormPhone('')
    setFormRealName('')
    setFormPassword('')
    setFormRole('CUSTOMER_SERVICE')
    setFormDepartmentId('')
    setShowForm(false)
  }

  const handleCreate = async () => {
    if (!formUsername || !formPhone || !formRealName || !formPassword) {
      toast('error', '请填写完整信息')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(formPhone)) {
      toast('error', '手机号格式不正确')
      return
    }
    if (formPassword.length < 8) {
      toast('error', '密码至少8位')
      return
    }
    setIsSaving(true)
    try {
      const res = await apiFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formUsername,
          phone: formPhone,
          realName: formRealName,
          password: formPassword,
          role: formRole,
          departmentId: formDepartmentId || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast('success', '员工创建成功')
        resetForm()
        fetchData()
      } else {
        toast('error', json.error?.message ?? '创建失败')
      }
    } catch {
      toast('error', '创建失败')
    } finally {
      setIsSaving(false)
    }
  }

  const canCreate = user?.role && ['SUPER_ADMIN', 'COMPANY_OWNER'].includes(user.role)

  // 按角色分组
  const grouped = employees.reduce((acc, emp) => {
    const group = emp.role.includes('CS') || emp.role === 'CUSTOMER_SERVICE' ? '客服部' : '签证部'
    if (!acc[group]) acc[group] = []
    acc[group].push(emp)
    return acc
  }, {} as Record<string, Employee[]>)

  return (
    <div className="space-y-6">
      <PageHeader
        title="团队管理"
        description="管理员工与部门"
        action={canCreate ? (
          <button
            onClick={() => setShowForm(true)}
            className="glass-btn-primary flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加员工
          </button>
        ) : undefined}
      />

      {/* 创建表单 */}
      {showForm && (
        <GlassCard className="p-6 animate-fade-in-up space-y-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">添加员工</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">用户名</label>
              <input value={formUsername} onChange={(e) => setFormUsername(e.target.value)} placeholder="登录用户名" className="w-full glass-input text-sm" />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">姓名</label>
              <input value={formRealName} onChange={(e) => setFormRealName(e.target.value)} placeholder="真实姓名" className="w-full glass-input text-sm" />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">手机号</label>
              <input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="手机号" className="w-full glass-input text-sm" />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">密码</label>
              <input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="至少8位，含大小写+数字" className="w-full glass-input text-sm" />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">角色</label>
              <select value={formRole} onChange={(e) => setFormRole(e.target.value)} className="w-full glass-input text-sm">
                {Object.entries(ROLE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">部门</label>
              <select value={formDepartmentId} onChange={(e) => setFormDepartmentId(e.target.value)} className="w-full glass-input text-sm">
                <option value="">不指定</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={resetForm} className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">取消</button>
            <button onClick={handleCreate} disabled={isSaving} className="glass-btn-primary px-6 py-2 text-sm font-medium disabled:opacity-50">
              {isSaving ? '创建中...' : '创建'}
            </button>
          </div>
        </GlassCard>
      )}

      {/* 员工列表 */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-6 h-6 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
        </div>
      ) : employees.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <p className="text-[var(--color-text-secondary)]">暂无员工</p>
        </GlassCard>
      ) : (
        Object.entries(grouped).map(([group, members]) => (
          <div key={group} className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">{group}（{members.length} 人）</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.map((emp) => (
                <GlassCard key={emp.id} className="p-4 animate-fade-in-up">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/15 flex items-center justify-center text-sm font-medium text-[var(--color-primary-light)]">
                      {emp.realName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">{emp.realName}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${emp.status === 'ACTIVE' ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]' : 'bg-[var(--color-error)]/15 text-[var(--color-error)]'}`}>
                          {emp.status === 'ACTIVE' ? '在职' : '停用'}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--color-text-placeholder)]">
                        {ROLE_LABELS[emp.role] ?? emp.role} · {emp.phone}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
