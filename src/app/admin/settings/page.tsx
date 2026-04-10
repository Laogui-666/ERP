'use client'
import { apiFetch } from '@shared/lib/api-client'
import { useEffect, useState, useCallback } from 'react'
import { Card } from '@shared/ui/card'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { PageHeader } from '@shared/components/layout/page-header'
import { useToast } from '@shared/ui/toast'
import { useAuth } from '@shared/hooks/use-auth'

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [companyName, setCompanyName] = useState('')
  const [companyPhone, setCompanyPhone] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const fetchCompany = useCallback(async () => {
    try {
      const res = await apiFetch('/api/auth/me')
      const json = await res.json()
      if (json.success && json.data.company) {
        setCompanyName(json.data.company.name ?? '')
        setCompanyPhone(json.data.company.phone ?? '')
        setCompanyEmail(json.data.company.email ?? '')
        setCompanyAddress(json.data.company.address ?? '')
      }
    } catch {
      // 静默失败
    }
  }, [])

  useEffect(() => { fetchCompany() }, [fetchCompany])

  const handleSave = async () => {
    if (!companyName.trim()) {
      toast('error', '公司名称不能为空')
      return
    }
    setIsSaving(true)
    try {
      const res = await apiFetch('/api/companies/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyName,
          phone: companyPhone || undefined,
          email: companyEmail || undefined,
          address: companyAddress || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast('success', '保存成功')
      } else {
        toast('error', json.error?.message ?? '保存失败')
      }
    } catch {
      toast('error', '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const canEdit = user?.role && ['SUPER_ADMIN', 'COMPANY_OWNER'].includes(user.role)

  return (
    <div className="space-y-6">
      <PageHeader title="系统设置" description="公司配置与系统管理" />

      {/* 公司信息 */}
      <Card className="space-y-4">
        <h3 className="text-sm font-semibold text-glass-primary">公司信息</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="公司名称"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={!canEdit}
              className="text-sm"
            />
          </div>
          <div>
            <Input
              label="联系电话"
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
              disabled={!canEdit}
              className="text-sm"
            />
          </div>
          <div>
            <Input
              label="邮箱"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
              disabled={!canEdit}
              className="text-sm"
            />
          </div>
          <div>
            <Input
              label="地址"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              disabled={!canEdit}
              className="text-sm"
            />
          </div>
        </div>
        {canEdit && (
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={isSaving}
            >
              保存
            </Button>
          </div>
        )}
      </Card>

      {/* 系统信息 */}
      <Card className="space-y-3">
        <h3 className="text-sm font-semibold text-glass-primary">系统信息</h3>
        <div className="space-y-2 text-sm">
          <InfoRow label="当前用户" value={user?.realName ?? '-'} />
          <InfoRow label="角色" value={user?.role ?? '-'} />
          <InfoRow label="系统版本" value="V25.0" />
          <InfoRow label="技术栈" value="Next.js 15.5 + React 19 + Prisma + MySQL" />
        </div>
      </Card>

      {/* 超管专属：数据库信息 */}
      {isSuperAdmin && (
        <Card className="space-y-3">
          <h3 className="text-sm font-semibold text-glass-primary">数据库信息（仅超管可见）</h3>
          <div className="space-y-2 text-sm">
            <InfoRow label="数据库" value="阿里云 RDS MySQL 8.0" />
            <InfoRow label="数据表" value="14 张（erp_ 前缀）" />
            <InfoRow label="文件存储" value="阿里云 OSS (oss-cn-beijing)" />
            <InfoRow label="实时通信" value="Socket.io 4.8" />
          </div>
        </Card>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-glass-border last:border-0">
      <span className="text-glass-muted">{label}</span>
      <span className="text-glass-primary font-medium">{value}</span>
    </div>
  )
}
