import { getMcpServer } from '../mcp-server'
import { useAuthStore } from '@shared/stores/auth-store'

export const registerUserTools = async () => {
  if (typeof window === 'undefined') return

  const server = getMcpServer()
  if (!server) return

  const { z } = await import('@opentiny/next-sdk')

  server.registerTool(
    'get_users',
    {
      title: '获取用户列表',
      description: '获取用户列表，支持筛选和分页',
      inputSchema: {
        page: z.number().optional().describe('页码，默认 1'),
        pageSize: z.number().optional().describe('每页数量，默认 20'),
        role: z.string().optional().describe('角色筛选'),
        keyword: z.string().optional().describe('搜索关键词')
      }
    },
    async (_params: any) => {
      try {
        const authStore = useAuthStore.getState()
        const role = authStore.user?.role

        if (!role) {
          return {
            content: [{ type: 'text', text: '用户未登录' }]
          }
        }

        const { hasPermission } = await import('@shared/lib/rbac')
        if (!hasPermission(role, 'users', 'read')) {
          return {
            content: [{ type: 'text', text: '权限不足，无法查看用户列表' }]
          }
        }

        return {
          content: [{
            type: 'text',
            text: `用户列表：\n` +
                  `注意：此工具需要与实际 API 集成后才能返回真实数据`
          }]
        }
      } catch (error) {
        console.error('获取用户列表失败:', error)
        return {
          content: [{ type: 'text', text: '获取用户列表失败' }]
        }
      }
    }
  )

  server.registerTool(
    'create_user',
    {
      title: '创建用户',
      description: '创建新用户',
      inputSchema: {
        username: z.string().describe('用户名'),
        realName: z.string().describe('真实姓名'),
        email: z.string().describe('邮箱'),
        role: z.string().describe('角色'),
        departmentId: z.string().optional().describe('部门 ID')
      }
    },
    async (params: any) => {
      try {
        const authStore = useAuthStore.getState()
        const role = authStore.user?.role

        if (!role) {
          return {
            content: [{ type: 'text', text: '用户未登录' }]
          }
        }

        const { hasPermission } = await import('@shared/lib/rbac')
        if (!hasPermission(role, 'users', 'create')) {
          return {
            content: [{ type: 'text', text: '权限不足，无法创建用户' }]
          }
        }

        return {
          content: [{
            type: 'text',
            text: `用户 ${params.username} 创建成功\n` +
                  `注意：此工具需要与实际 API 集成后才能执行真实操作`
          }]
        }
      } catch (error) {
        console.error('创建用户失败:', error)
        return {
          content: [{ type: 'text', text: '创建用户失败' }]
        }
      }
    }
  )
}
