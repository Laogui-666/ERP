import { getMcpServer } from '../mcp-server'
import { useAuthStore } from '@shared/stores/auth-store'

export const registerOrderTools = async () => {
  if (typeof window === 'undefined') return

  const server = getMcpServer()
  if (!server) return

  const { z } = await import('@opentiny/next-sdk')

  server.registerTool(
    'get_orders',
    {
      title: '获取订单列表',
      description: '获取订单列表，支持分页和筛选',
      inputSchema: {
        page: z.number().optional().describe('页码，默认 1'),
        pageSize: z.number().optional().describe('每页数量，默认 20'),
        status: z.string().optional().describe('订单状态筛选'),
        keyword: z.string().optional().describe('搜索关键词')
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
        if (!hasPermission(role, 'orders', 'read')) {
          return {
            content: [{ type: 'text', text: '权限不足，无法查看订单' }]
          }
        }

        const page = params.page || 1
        const pageSize = params.pageSize || 20

        return {
          content: [{
            type: 'text',
            text: `订单列表（第 ${page} 页，每页 ${pageSize} 条）：\n` +
                  `- 状态筛选：${params.status || '全部'}\n` +
                  `- 关键词：${params.keyword || '无'}\n\n` +
                  `注意：此工具需要与实际 API 集成后才能返回真实数据`
          }]
        }
      } catch (error) {
        console.error('获取订单列表失败:', error)
        return {
          content: [{ type: 'text', text: '获取订单列表失败' }]
        }
      }
    }
  )

  server.registerTool(
    'get_order_detail',
    {
      title: '获取订单详情',
      description: '获取指定订单的详细信息',
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
        if (!hasPermission(role, 'orders', 'read')) {
          return {
            content: [{ type: 'text', text: '权限不足，无法查看订单详情' }]
          }
        }

        return {
          content: [{
            type: 'text',
            text: `订单详情（ID: ${params.orderId}）：\n` +
                  `注意：此工具需要与实际 API 集成后才能返回真实数据`
          }]
        }
      } catch (error) {
        console.error('获取订单详情失败:', error)
        return {
          content: [{ type: 'text', text: '获取订单详情失败' }]
        }
      }
    }
  )

  server.registerTool(
    'update_order_status',
    {
      title: '更新订单状态',
      description: '更新指定订单的状态',
      inputSchema: {
        orderId: z.string().describe('订单 ID'),
        status: z.string().describe('新的订单状态')
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
        if (!hasPermission(role, 'orders', 'transition')) {
          return {
            content: [{ type: 'text', text: '权限不足，无法更新订单状态' }]
          }
        }

        return {
          content: [{
            type: 'text',
            text: `订单 ${params.orderId} 状态已更新为：${params.status}\n` +
                  `注意：此工具需要与实际 API 集成后才能执行真实操作`
          }]
        }
      } catch (error) {
        console.error('更新订单状态失败:', error)
        return {
          content: [{ type: 'text', text: '更新订单状态失败' }]
        }
      }
    }
  )

  server.registerTool(
    'claim_order',
    {
      title: '接单',
      description: '从公共池领取订单',
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
        if (!hasPermission(role, 'pool', 'claim')) {
          return {
            content: [{ type: 'text', text: '权限不足，无法接单' }]
          }
        }

        return {
          content: [{
            type: 'text',
            text: `已成功领取订单 ${params.orderId}\n` +
                  `注意：此工具需要与实际 API 集成后才能执行真实操作`
          }]
        }
      } catch (error) {
        console.error('接单失败:', error)
        return {
          content: [{ type: 'text', text: '接单失败' }]
        }
      }
    }
  )

  server.registerTool(
    'reassign_order',
    {
      title: '转单',
      description: '将订单转交给其他用户',
      inputSchema: {
        orderId: z.string().describe('订单 ID'),
        targetUserId: z.string().describe('目标用户 ID')
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
        if (!hasPermission(role, 'orders', 'reassign')) {
          return {
            content: [{ type: 'text', text: '权限不足，无法转单' }]
          }
        }

        return {
          content: [{
            type: 'text',
            text: `订单 ${params.orderId} 已转交给用户 ${params.targetUserId}\n` +
                  `注意：此工具需要与实际 API 集成后才能执行真实操作`
          }]
        }
      } catch (error) {
        console.error('转单失败:', error)
        return {
          content: [{ type: 'text', text: '转单失败' }]
        }
      }
    }
  )
}
