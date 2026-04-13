import { getMcpServer } from '../mcp-server'
import { useAuthStore } from '@shared/stores/auth-store'

export const registerChatTools = async () => {
  if (typeof window === 'undefined') return

  const server = getMcpServer()
  if (!server) return

  const { z } = await import('@opentiny/next-sdk')

  server.registerTool(
    'get_chat_rooms',
    {
      title: '获取聊天房间',
      description: '获取聊天房间列表',
      inputSchema: {}
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
        if (!hasPermission(role, 'chat', 'read')) {
          return {
            content: [{ type: 'text', text: '权限不足，无法查看聊天' }]
          }
        }

        return {
          content: [{
            type: 'text',
            text: `聊天房间列表：\n` +
                  `注意：此工具需要与实际 API 集成后才能返回真实数据`
          }]
        }
      } catch (error) {
        console.error('获取聊天房间失败:', error)
        return {
          content: [{ type: 'text', text: '获取聊天房间失败' }]
        }
      }
    }
  )

  server.registerTool(
    'send_chat_message',
    {
      title: '发送聊天消息',
      description: '发送聊天消息到指定房间',
      inputSchema: {
        orderId: z.string().describe('订单 ID'),
        message: z.string().describe('消息内容')
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
        if (!hasPermission(role, 'chat', 'send')) {
          return {
            content: [{ type: 'text', text: '权限不足，无法发送消息' }]
          }
        }

        return {
          content: [{
            type: 'text',
            text: `消息发送成功\n` +
                  `注意：此工具需要与实际 API 集成后才能执行真实操作`
          }]
        }
      } catch (error) {
        console.error('发送消息失败:', error)
        return {
          content: [{ type: 'text', text: '发送消息失败' }]
        }
      }
    }
  )
}
