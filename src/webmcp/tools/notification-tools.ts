import { getMcpServer } from '../mcp-server'
import { useAuthStore } from '@shared/stores/auth-store'

export const registerNotificationTools = async () => {
  if (typeof window === 'undefined') return

  const server = getMcpServer()
  if (!server) return

  const { z } = await import('@opentiny/next-sdk')

  server.registerTool(
    'get_notifications',
    {
      title: '获取通知列表',
      description: '获取通知列表',
      inputSchema: {
        unreadOnly: z.boolean().optional().describe('只看未读')
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
        if (!hasPermission(role, 'notifications', 'read')) {
          return {
            content: [{ type: 'text', text: '权限不足，无法查看通知' }]
          }
        }

        return {
          content: [{
            type: 'text',
            text: `通知列表：\n` +
                  `注意：此工具需要与实际 API 集成后才能返回真实数据`
          }]
        }
      } catch (error) {
        console.error('获取通知失败:', error)
        return {
          content: [{ type: 'text', text: '获取通知失败' }]
        }
      }
    }
  )

  server.registerTool(
    'mark_notification_read',
    {
      title: '标记通知已读',
      description: '标记指定通知为已读',
      inputSchema: {
        notificationId: z.string().describe('通知 ID')
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
        if (!hasPermission(role, 'notifications', 'update')) {
          return {
            content: [{ type: 'text', text: '权限不足，无法更新通知' }]
          }
        }

        return {
          content: [{
            type: 'text',
            text: `通知已标记为已读\n` +
                  `注意：此工具需要与实际 API 集成后才能执行真实操作`
          }]
        }
      } catch (error) {
        console.error('标记通知失败:', error)
        return {
          content: [{ type: 'text', text: '标记通知失败' }]
        }
      }
    }
  )
}
