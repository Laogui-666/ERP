import { getMcpServer } from '../mcp-server'
import { useAuthStore } from '@shared/stores/auth-store'

export const registerDocumentTools = async () => {
  if (typeof window === 'undefined') return

  const server = getMcpServer()
  if (!server) return

  const { z } = await import('@opentiny/next-sdk')

  server.registerTool(
    'get_documents',
    {
      title: '获取文档列表',
      description: '获取文档列表',
      inputSchema: {
        orderId: z.string().optional().describe('订单 ID'),
        status: z.string().optional().describe('文档状态')
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
        if (!hasPermission(role, 'documents', 'read')) {
          return {
            content: [{ type: 'text', text: '权限不足，无法查看文档' }]
          }
        }

        return {
          content: [{
            type: 'text',
            text: `文档列表：\n` +
                  `注意：此工具需要与实际 API 集成后才能返回真实数据`
          }]
        }
      } catch (error) {
        console.error('获取文档列表失败:', error)
        return {
          content: [{ type: 'text', text: '获取文档列表失败' }]
        }
      }
    }
  )

  server.registerTool(
    'upload_document',
    {
      title: '上传文档',
      description: '上传文档到订单',
      inputSchema: {
        orderId: z.string().describe('订单 ID'),
        fileName: z.string().describe('文件名'),
        fileType: z.string().describe('文件类型')
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
        if (!hasPermission(role, 'documents', 'create')) {
          return {
            content: [{ type: 'text', text: '权限不足，无法上传文档' }]
          }
        }

        return {
          content: [{
            type: 'text',
            text: `文档 ${params.fileName} 上传成功\n` +
                  `注意：此工具需要与实际 API 集成后才能执行真实操作`
          }]
        }
      } catch (error) {
        console.error('上传文档失败:', error)
        return {
          content: [{ type: 'text', text: '上传文档失败' }]
        }
      }
    }
  )
}
