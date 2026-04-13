import { getMcpServer } from '../mcp-server'
import { useAuthStore } from '@shared/stores/auth-store'

export const registerPermissionTools = async () => {
  if (typeof window === 'undefined') return

  const server = getMcpServer()
  if (!server) return

  const { z } = await import('@opentiny/next-sdk')

  server.registerTool(
    'get_current_user',
    {
      title: '获取当前用户信息',
      description: '获取当前登录用户的详细信息，包括角色、权限等',
      inputSchema: {}
    },
    async () => {
      try {
        const authStore = useAuthStore.getState()
        const user = authStore.user
        const role = user?.role

        if (!user) {
          return {
            content: [{ type: 'text', text: '用户未登录' }]
          }
        }

        return {
          content: [{
            type: 'text',
            text: `当前用户：${user.username}\n` +
                  `真实姓名：${user.realName || '未设置'}\n` +
                  `角色：${getRoleName(role || '')}\n` +
                  `权限级别：${getRoleLevel(role || '')}\n` +
                  `所属公司：${user.companyId || '无'}`
          }]
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        return {
          content: [{ type: 'text', text: '获取用户信息失败' }]
        }
      }
    }
  )

  server.registerTool(
    'check_permission',
    {
      title: '检查权限',
      description: '检查当前用户是否具有指定资源的操作权限',
      inputSchema: {
        resource: z.string().describe('资源名称，如 orders、users、documents 等'),
        action: z.string().describe('操作名称，如 read、create、update、delete 等')
      }
    },
    async (params: any) => {
      try {
        const { hasPermission } = await import('@shared/lib/rbac')
        const authStore = useAuthStore.getState()
        const role = authStore.user?.role

        if (!role) {
          return {
            content: [{ type: 'text', text: '用户未登录' }]
          }
        }

        const hasAccess = hasPermission(role as any, params.resource, params.action)

        return {
          content: [{
            type: 'text',
            text: `${getRoleName(role || '')} ${hasAccess ? '具有' : '不具有'} ${params.resource}.${params.action} 权限`
          }]
        }
      } catch (error) {
        console.error('权限检查失败:', error)
        return {
          content: [{ type: 'text', text: '权限检查失败' }]
        }
      }
    }
  )

  server.registerTool(
    'get_role_permissions',
    {
      title: '获取角色权限',
      description: '获取指定角色的所有权限',
      inputSchema: {
        role: z.enum(['SUPER_ADMIN', 'COMPANY_OWNER', 'CS_ADMIN', 'CUSTOMER_SERVICE', 'VISA_ADMIN', 'DOC_COLLECTOR', 'OPERATOR', 'OUTSOURCE', 'CUSTOMER']).describe('角色代码')
      }
    },
    async (params: any) => {
      try {
        const { ROLE_PERMISSIONS } = await import('@shared/lib/rbac')
        const permissions = ROLE_PERMISSIONS[params.role as keyof typeof ROLE_PERMISSIONS]

        if (!permissions) {
          return {
            content: [{ type: 'text', text: '角色不存在' }]
          }
        }

        let permissionText = `角色 ${getRoleName(params.role)} 的权限：\n`
        permissions.forEach((perm: any) => {
          permissionText += `- ${perm.resource}: ${perm.actions.join(', ')}\n`
        })

        return {
          content: [{ type: 'text', text: permissionText }]
        }
      } catch (error) {
        console.error('获取角色权限失败:', error)
        return {
          content: [{ type: 'text', text: '获取角色权限失败' }]
        }
      }
    }
  )

  server.registerTool(
    'get_all_roles',
    {
      title: '获取所有角色',
      description: '获取系统中所有的角色信息',
      inputSchema: {}
    },
    async () => {
      try {
        const roles = [
          { code: 'SUPER_ADMIN', name: '超级管理员', level: 1 },
          { code: 'COMPANY_OWNER', name: '公司负责人', level: 2 },
          { code: 'CS_ADMIN', name: '客服部管理员', level: 3 },
          { code: 'CUSTOMER_SERVICE', name: '客服', level: 4 },
          { code: 'VISA_ADMIN', name: '签证部管理员', level: 5 },
          { code: 'DOC_COLLECTOR', name: '资料员', level: 6 },
          { code: 'OPERATOR', name: '签证操作员', level: 7 },
          { code: 'OUTSOURCE', name: '外包业务员', level: 8 },
          { code: 'CUSTOMER', name: '普通用户', level: 9 }
        ]

        let rolesText = '系统角色列表：\n'
        roles.forEach(role => {
          rolesText += `Lv${role.level} - ${role.code}: ${role.name}\n`
        })

        return {
          content: [{ type: 'text', text: rolesText }]
        }
      } catch (error) {
        console.error('获取角色列表失败:', error)
        return {
          content: [{ type: 'text', text: '获取角色列表失败' }]
        }
      }
    }
  )

  server.registerTool(
    'get_available_tools',
    {
      title: '获取可用工具',
      description: '根据当前用户角色获取可用的 MCP 工具列表',
      inputSchema: {}
    },
    async () => {
      try {
        const authStore = useAuthStore.getState()
        const role = authStore.user?.role

        if (!role) {
          return {
            content: [{ type: 'text', text: '用户未登录' }]
          }
        }

        const availableTools = getRoleAvailableTools(role || '')
        let toolsText = `角色 ${getRoleName(role || '')} 可用的工具：\n`
        availableTools.forEach(tool => {
          toolsText += `- ${tool.name}: ${tool.description}\n`
        })

        return {
          content: [{ type: 'text', text: toolsText }]
        }
      } catch (error) {
        console.error('获取可用工具失败:', error)
        return {
          content: [{ type: 'text', text: '获取可用工具失败' }]
        }
      }
    }
  )
}

function getRoleName(role: string): string {
  const roleNames: Record<string, string> = {
    'SUPER_ADMIN': '超级管理员',
    'COMPANY_OWNER': '公司负责人',
    'CS_ADMIN': '客服部管理员',
    'CUSTOMER_SERVICE': '客服',
    'VISA_ADMIN': '签证部管理员',
    'DOC_COLLECTOR': '资料员',
    'OPERATOR': '签证操作员',
    'OUTSOURCE': '外包业务员',
    'CUSTOMER': '普通用户'
  }
  return roleNames[role] || role
}

function getRoleLevel(role: string): number {
  const roleLevels: Record<string, number> = {
    'SUPER_ADMIN': 1,
    'COMPANY_OWNER': 2,
    'CS_ADMIN': 3,
    'CUSTOMER_SERVICE': 4,
    'VISA_ADMIN': 5,
    'DOC_COLLECTOR': 6,
    'OPERATOR': 7,
    'OUTSOURCE': 8,
    'CUSTOMER': 9
  }
  return roleLevels[role] || 9
}

function getRoleAvailableTools(role: string): Array<{ name: string, description: string }> {
  const baseTools = [
    { name: 'search_destinations', description: '搜索热门目的地' },
    { name: 'get_visa_info', description: '获取签证信息' },
    { name: 'navigate_to_page', description: '导航到页面' },
    { name: 'get_current_user', description: '获取当前用户信息' },
    { name: 'check_permission', description: '检查权限' },
    { name: 'get_all_roles', description: '获取所有角色' }
  ]

  const roleSpecificTools: Record<string, Array<{ name: string, description: string }>> = {
    'SUPER_ADMIN': [
      { name: 'get_role_permissions', description: '获取角色权限' },
      { name: 'get_available_tools', description: '获取可用工具' }
    ],
    'COMPANY_OWNER': [
      { name: 'get_role_permissions', description: '获取角色权限' },
      { name: 'get_available_tools', description: '获取可用工具' }
    ],
    'CS_ADMIN': [
      { name: 'get_available_tools', description: '获取可用工具' }
    ],
    'VISA_ADMIN': [
      { name: 'get_available_tools', description: '获取可用工具' }
    ]
  }

  const specificTools = roleSpecificTools[role] || []
  return [...baseTools, ...specificTools]
}
