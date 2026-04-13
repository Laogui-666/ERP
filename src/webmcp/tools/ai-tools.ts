import { getMcpServer } from '../mcp-server'
import { useAuthStore } from '@shared/stores/auth-store'

export const registerAITools = async () => {
  if (typeof window === 'undefined') return

  const server = getMcpServer()
  if (!server) return

  const { z } = await import('@opentiny/next-sdk')

  // AI 文档分析工具
  server.registerTool(
    'analyze_document',
    {
      title: '分析文档',
      description: '使用AI分析文档内容、质量和分类',
      inputSchema: {
        fileId: z.string().describe('文件 ID'),
        analysisType: z.enum(['quality', 'classification', 'verification']).describe('分析类型')
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
            content: [{ type: 'text', text: '权限不足，无法分析文档' }]
          }
        }

        const { fileId, analysisType } = params
        const response = await fetch(`/api/ai/document-analysis?fileId=${fileId}&analysisType=${analysisType}`)
        const result = await response.json()

        if (result.error) {
          return { content: [{ type: 'text', text: `分析失败: ${result.error}` }] }
        }

        return {
          content: [
            {
              type: 'text',
              text: `文档分析结果 (${analysisType}):`
            },
            {
              type: 'text',
              text: `质量评分: ${result.qualityScore || 'N/A'}`
            },
            {
              type: 'text',
              text: `分类: ${result.classification || 'N/A'}`
            },
            {
              type: 'text',
              text: `验证状态: ${result.verification || 'N/A'}`
            },
            {
              type: 'text',
              text: `建议: ${result.suggestions || '无'}`
            }
          ]
        }
      } catch (error) {
        console.error('分析文档失败:', error)
        return { content: [{ type: 'text', text: '分析过程中出现错误' }] }
      }
    }
  )

  // AI 文档总结工具
  server.registerTool(
    'summarize_document',
    {
      title: '总结文档',
      description: '使用AI生成文档内容摘要',
      inputSchema: {
        fileId: z.string().describe('文件 ID'),
        length: z.number().optional().describe('摘要长度 (单词数)')
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
            content: [{ type: 'text', text: '权限不足，无法总结文档' }]
          }
        }

        const { fileId, length = 100 } = params
        // 模拟AI摘要功能
        const summary = `这是文件 ${fileId} 的摘要内容，包含了文档的主要信息和关键点。摘要长度约为 ${length} 单词。`

        return {
          content: [
            {
              type: 'text',
              text: '文档摘要:'
            },
            {
              type: 'text',
              text: summary
            }
          ]
        }
      } catch (error) {
        console.error('总结文档失败:', error)
        return { content: [{ type: 'text', text: '总结过程中出现错误' }] }
      }
    }
  )

  // AI 文档对比工具
  server.registerTool(
    'compare_documents',
    {
      title: '对比文档',
      description: '使用AI对比两个文档的差异',
      inputSchema: {
        fileId1: z.string().describe('第一个文件 ID'),
        fileId2: z.string().describe('第二个文件 ID')
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
            content: [{ type: 'text', text: '权限不足，无法对比文档' }]
          }
        }

        const { fileId1, fileId2 } = params
        // 模拟AI对比功能
        const comparison = `文件 ${fileId1} 和文件 ${fileId2} 的主要差异包括：\n1. 内容结构不同\n2. 数据字段存在差异\n3. 格式规范不一致`

        return {
          content: [
            {
              type: 'text',
              text: '文档对比结果:'
            },
            {
              type: 'text',
              text: comparison
            }
          ]
        }
      } catch (error) {
        console.error('对比文档失败:', error)
        return { content: [{ type: 'text', text: '对比过程中出现错误' }] }
      }
    }
  )
}

export default registerAITools