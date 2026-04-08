'use client'
import { apiFetch } from '@shared/lib/api-client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '@shared/ui/toast'
import { useAuth } from '@shared/hooks/use-auth'
import { LiquidTeamCard } from '@design-system/components/liquid-team-card'
import { LiquidCard, LiquidCardContent } from '@design-system/components/liquid-card'
import { LiquidButton } from '@design-system/components/liquid-button'
import { LiquidInput } from '@design-system/components/liquid-input'
import { liquidSpringConfig } from '@design-system/theme/animations'

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

  // 获取部门名称
  const getDepartmentName = (deptId: string | null) => {
    if (!deptId) return undefined
    return departments.find(d => d.id === deptId)?.name
  }

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={liquidSpringConfig.gentle}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-liquid-deep tracking-tight">
            团队管理
          </h1>
          <p className="mt-1 text-sm text-liquid-mist">
            管理员工与部门 · 共 {employees.length} 人
          </p>
        </div>
        {canCreate && (
          <LiquidButton
            variant="primary"
            size="md"
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
            onClick={() => setShowForm(true)}
          >
            添加员工
          </LiquidButton>
        )}
      </motion.div>

      {/* 创建表单 */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={liquidSpringConfig.medium}
        >
          <LiquidCard padding="lg" variant="liquid-elevated">
            <LiquidCardContent>
              <h3 className="text-lg font-semibold text-liquid-deep mb-4">添加员工</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <LiquidInput
                  label="用户名"
                  placeholder="登录用户名"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                />
                <LiquidInput
                  label="姓名"
                  placeholder="真实姓名"
                  value={formRealName}
                  onChange={(e) => setFormRealName(e.target.value)}
                />
                <LiquidInput
                  label="手机号"
                  placeholder="手机号"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
                <LiquidInput
                  label="密码"
                  type="password"
                  placeholder="至少8位，含大小写+数字"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                />
                <div>
                  <label className="text-sm font-semibold text-liquid-deep mb-2 block">角色</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-5 py-3.5 rounded-3xl bg-white/55 backdrop-blur-xl border border-white/50 text-liquid-deep text-sm focus:outline-none focus:bg-white/70 focus:border-liquid-ocean/60 hover:border-liquid-ocean/40 shadow-liquid-soft focus:shadow-liquid-medium transition-all"
                  >
                    {Object.entries(ROLE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-liquid-deep mb-2 block">部门</label>
                  <select
                    value={formDepartmentId}
                    onChange={(e) => setFormDepartmentId(e.target.value)}
                    className="w-full px-5 py-3.5 rounded-3xl bg-white/55 backdrop-blur-xl border border-white/50 text-liquid-deep text-sm focus:outline-none focus:bg-white/70 focus:border-liquid-ocean/60 hover:border-liquid-ocean/40 shadow-liquid-soft focus:shadow-liquid-medium transition-all"
                  >
                    <option value="">不指定</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <LiquidButton
                  variant="ghost"
                  size="md"
                  onClick={resetForm}
                >
                  取消
                </LiquidButton>
                <LiquidButton
                  variant="primary"
                  size="md"
                  isLoading={isSaving}
                  onClick={handleCreate}
                >
                  创建
                </LiquidButton>
              </div>
            </LiquidCardContent>
          </LiquidCard>
        </motion.div>
      )}

      {/* 员工列表 */}
      {isLoading ? (
        <LiquidCard padding="xl" variant="liquid" className="text-center">
          <motion.div
            className="inline-block w-6 h-6 border-2 border-liquid-ocean/30 border-t-liquid-ocean rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="mt-3 text-sm text-liquid-mist">加载中...</p>
        </LiquidCard>
      ) : employees.length === 0 ? (
        <LiquidCard padding="xl" variant="liquid" className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={liquidSpringConfig.bouncy}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-liquid-ocean/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-liquid-ocean" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-lg text-liquid-deep font-semibold">暂无员工</p>
            <p className="text-sm text-liquid-mist mt-1">点击&quot;添加员工&quot;按钮创建第一个员工</p>
          </motion.div>
        </LiquidCard>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, members], groupIndex) => (
            <motion.div
              key={group}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...liquidSpringConfig.medium, delay: groupIndex * 0.1 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-liquid-mist">{group}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-liquid-ocean/10 text-liquid-ocean">
                  {members.length} 人
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {members.map((emp, index) => (
                  <LiquidTeamCard
                    key={emp.id}
                    name={emp.realName}
                    role={emp.role}
                    phone={emp.phone}
                    status={emp.status}
                    email={emp.email}
                    department={getDepartmentName(emp.departmentId)}
                    delay={index}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
