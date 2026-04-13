import { getMcpServer } from '../mcp-server'
import { useAuthStore } from '@shared/stores/auth-store'

export const registerDocumentRequirementTools = async () => {
  if (typeof window === 'undefined') return

  const server = getMcpServer()
  if (!server) return

  const { z } = await import('@opentiny/next-sdk')

  // 获取资料需求清单
  server.registerTool(
    'get_document_requirements',
    {
      title: '获取资料需求清单',
      description: '获取指定订单的资料需求清单',
      inputSchema: {
        orderId: z.string().describe('订单 ID')
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
        if (!hasPermission(role, 'documents', 'read')) {
          return {
            content: [{ type: 'text', text: '权限不足，无法查看资料清单' }]
          }
        }

        const response = await fetch(`/api/orders/${params.orderId}/documents`)
        const data = await response.json()
        
        if (data.success) {
          const requirements = data.data
          let result = `订单 ${params.orderId} 的资料需求清单：\n\n`
          requirements.forEach((req: any) => {
            result += `- ${req.name} ${req.isRequired ? '(必填)' : ''}\n`
            if (req.description) result += `  说明：${req.description}\n`
            result += `  状态：${req.status}\n`
            if (req.files.length > 0) {
              result += `  已上传 ${req.files.length} 个文件\n`
            }
          })
          return {
            content: [{ type: 'text', text: result }]
          }
        } else {
          return {
            content: [{ type: 'text', text: '获取资料清单失败' }]
          }
        }
      } catch (error) {
        console.error('获取资料清单失败:', error)
        return {
          content: [{ type: 'text', text: '获取资料清单失败' }]
        }
      }
    }
  )

  // 添加资料需求
  server.registerTool(
    'add_document_requirement',
    {
      title: '添加资料需求',
      description: '为指定订单添加资料需求',
      inputSchema: {
        orderId: z.string().describe('订单 ID'),
        name: z.string().describe('资料名称'),
        description: z.string().optional().describe('资料说明'),
        isRequired: z.boolean().optional().describe('是否必填')
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
            content: [{ type: 'text', text: '权限不足，无法添加资料需求' }]
          }
        }

        const response = await fetch(`/api/orders/${params.orderId}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{
              name: params.name,
              description: params.description,
              isRequired: params.isRequired ?? true
            }]
          })
        })
        const data = await response.json()
        
        if (data.success) {
          return {
            content: [{ type: 'text', text: `已成功添加资料需求：${params.name}` }]
          }
        } else {
          return {
            content: [{ type: 'text', text: '添加资料需求失败' }]
          }
        }
      } catch (error) {
        console.error('添加资料需求失败:', error)
        return {
          content: [{ type: 'text', text: '添加资料需求失败' }]
        }
      }
    }
  )

  // 审核资料
  server.registerTool(
    'review_document',
    {
      title: '审核资料',
      description: '审核指定的资料文件',
      inputSchema: {
        documentId: z.string().describe('资料文件 ID'),
        status: z.enum(['APPROVED', 'REJECTED', 'SUPPLEMENT']).describe('审核状态'),
        reason: z.string().optional().describe('审核原因')
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
        if (!hasPermission(role, 'documents', 'update')) {
          return {
            content: [{ type: 'text', text: '权限不足，无法审核资料' }]
          }
        }

        const response = await fetch(`/api/documents/files/${params.documentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reviewStatus: params.status,
            rejectReason: params.reason
          })
        })
        const data = await response.json()
        
        if (data.success) {
          const statusText = {
            'APPROVED': '合格',
            'REJECTED': '已驳回',
            'SUPPLEMENT': '需补充'
          }
          const status = params.status as keyof typeof statusText
          return {
            content: [{ type: 'text', text: `资料审核已完成，状态：${statusText[status]}` }]
          }
        } else {
          return {
            content: [{ type: 'text', text: '审核资料失败' }]
          }
        }
      } catch (error) {
        console.error('审核资料失败:', error)
        return {
          content: [{ type: 'text', text: '审核资料失败' }]
        }
      }
    }
  )
}
