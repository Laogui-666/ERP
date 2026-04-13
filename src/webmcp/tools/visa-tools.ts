import { getMcpServer } from '../mcp-server'
import { useAuthStore } from '@shared/stores/auth-store'

export const registerVisaTools = async () => {
  if (typeof window === 'undefined') return

  const server = getMcpServer()
  if (!server) return

  const { z } = await import('@opentiny/next-sdk')

  server.registerTool(
    'search_destinations',
    {
      title: '搜索热门目的地',
      description: '搜索热门目的地国家列表',
      inputSchema: {
        keyword: z.string().optional().describe('搜索关键词，可选')
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

        const destinations = [
          { name: '日本', visaType: '电子签', price: '¥599' },
          { name: '韩国', visaType: '电子签', price: '¥399' },
          { name: '法国', visaType: '申根签', price: '¥358' },
          { name: '意大利', visaType: '申根签', price: '¥358' },
          { name: '西班牙', visaType: '申根签', price: '¥358' },
          { name: '德国', visaType: '申根签', price: '¥358' },
          { name: '瑞士', visaType: '申根签', price: '¥358' },
          { name: '英国', visaType: '标准签', price: '¥1299' },
          { name: '澳大利亚', visaType: '电子签', price: '¥1399' },
          { name: '新西兰', visaType: '电子签', price: '¥1399' },
          { name: '加拿大', visaType: '电子签', price: '¥1099' },
          { name: '美国', visaType: '十年签', price: '¥1599' }
        ]

        let results = destinations
        if (params.keyword) {
          const keyword = params.keyword.toLowerCase()
          results = destinations.filter((d: any) => 
            d.name.toLowerCase().includes(keyword) ||
            d.visaType.toLowerCase().includes(keyword)
          )
        }

        return {
          content: [{
            type: 'text',
            text: `找到 ${results.length} 个热门目的地：\n${results.map((d: any) => 
              `- ${d.name}：${d.visaType}，价格 ${d.price}`
            ).join('\n')}`
          }]
        }
      } catch (error) {
        console.error('搜索目的地失败:', error)
        return {
          content: [{ type: 'text', text: '搜索目的地失败' }]
        }
      }
    }
  )

  server.registerTool(
    'get_visa_info',
    {
      title: '获取签证信息',
      description: '获取指定国家的签证详细信息',
      inputSchema: {
        country: z.string().describe('国家名称')
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

        const visaInfo: Record<string, any> = {
          '日本': {
            name: '日本',
            visaType: '电子签',
            price: '¥599',
            processingTime: '5-7个工作日',
            requiredDocuments: ['护照', '照片', '在职证明', '银行流水']
          },
          '韩国': {
            name: '韩国',
            visaType: '电子签',
            price: '¥399',
            processingTime: '3-5个工作日',
            requiredDocuments: ['护照', '照片', '申请表']
          },
          '法国': {
            name: '法国',
            visaType: '申根签',
            price: '¥358',
            processingTime: '10-15个工作日',
            requiredDocuments: ['护照', '照片', '行程单', '酒店预订单', '保险']
          }
        }

        const info = visaInfo[params.country]
        if (!info) {
          return {
            content: [{
              type: 'text',
              text: `暂未找到 ${params.country} 的签证信息，请尝试其他国家。`
            }]
          }
        }

        return {
          content: [{
            type: 'text',
            text: `${info.name} 签证信息：\n` +
                  `- 签证类型：${info.visaType}\n` +
                  `- 价格：${info.price}\n` +
                  `- 办理时间：${info.processingTime}\n` +
                  `- 所需材料：${info.requiredDocuments.join('、')}`
          }]
        }
      } catch (error) {
        console.error('获取签证信息失败:', error)
        return {
          content: [{ type: 'text', text: '获取签证信息失败' }]
        }
      }
    }
  )

  server.registerTool(
    'navigate_to_page',
    {
      title: '导航到页面',
      description: '导航到应用的指定页面',
      inputSchema: {
        page: z.enum(['home', 'services', 'login', 'register', 'dashboard', 'orders']).describe('页面名称')
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

        const pageRoutes: Record<string, string> = {
          'home': '/',
          'services': '/services',
          'login': '/login',
          'register': '/register',
          'dashboard': '/admin/dashboard',
          'orders': '/admin/orders'
        }

        const route = pageRoutes[params.page]
        if (route && typeof window !== 'undefined') {
          window.location.href = route
          return {
            content: [{
              type: 'text',
              text: `已导航到 ${params.page} 页面`
            }]
          }
        }

        return {
          content: [{
            type: 'text',
            text: `未知页面：${params.page}`
          }]
        }
      } catch (error) {
        console.error('导航失败:', error)
        return {
          content: [{ type: 'text', text: '导航失败' }]
        }
      }
    }
  )
}
