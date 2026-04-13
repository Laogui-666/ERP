# OpenTiny NEXT-SDKs WebMCP 接入指南

## 概述

本项目已成功接入 OpenTiny NEXT-SDKs 的 WebMCP 功能，使签证 ERP 系统可以被各类 AI 应用（如 VSCode Copilot、Cursor、Trae 等）通过 MCP 协议进行操作。

## 已完成的工作

### 1. 安装依赖

```bash
npm install @opentiny/next-sdk
```

### 2. 创建的文件结构

```
src/webmcp/
├── index.ts              # 导出模块
├── mcp-server.ts         # MCP Server 创建和管理
├── webmcp-client.ts      # WebMCP Client 连接管理
├── WebMcpInitializer.tsx # React 客户端初始化组件
└── tools/
    ├── visa-tools.ts     # 签证相关 MCP 工具
    ├── permission-tools.ts # 权限管理 MCP 工具
    ├── order-tools.ts    # 订单管理 MCP 工具
    ├── user-tools.ts     # 用户管理 MCP 工具
    ├── document-tools.ts # 文档管理 MCP 工具
    ├── chat-tools.ts     # 聊天管理 MCP 工具
    └── notification-tools.ts # 通知管理 MCP 工具
```

### 3. 集成到 Next.js

在 `src/app/layout.tsx` 中集成了 `WebMcpInitializer` 组件，在应用启动时自动初始化 WebMCP。

## 已注册的 MCP 工具

### 1. 签证相关工具

#### search_destinations - 搜索热门目的地

搜索热门目的地国家列表。

**参数：**
- `keyword` (可选): 搜索关键词

**示例：**
```
搜索热门目的地
搜索日本
```

#### get_visa_info - 获取签证信息

获取指定国家的签证详细信息。

**参数：**
- `country` (必需): 国家名称

**示例：**
```
获取日本签证信息
获取法国签证信息
```

#### navigate_to_page - 导航到页面

导航到应用的指定页面。

**参数：**
- `page` (必需): 页面名称，可选值：home, services, login, register, dashboard, orders

**示例：**
```
导航到首页
导航到服务页面
```

### 2. 权限相关工具

#### get_current_user - 获取当前用户信息

获取当前登录用户的详细信息，包括角色、权限等。

**参数：** 无

**示例：**
```
获取当前用户信息
```

#### check_permission - 检查权限

检查当前用户是否具有指定资源的操作权限。

**参数：**
- `resource` (必需): 资源名称，如 orders、users、documents 等
- `action` (必需): 操作名称，如 read、create、update、delete 等

**示例：**
```
检查是否有权限查看订单
检查是否有权限创建用户
```

#### get_role_permissions - 获取角色权限

获取指定角色的所有权限。

**参数：**
- `role` (必需): 角色代码，如 SUPER_ADMIN、COMPANY_OWNER 等

**示例：**
```
获取超级管理员的权限
获取客服的权限
```

#### get_all_roles - 获取所有角色

获取系统中所有的角色信息。

**参数：** 无

**示例：**
```
获取所有角色
```

#### get_available_tools - 获取可用工具

根据当前用户角色获取可用的 MCP 工具列表。

**参数：** 无

**示例：**
```
获取我可用的工具
```

### 3. 订单管理工具

#### get_orders - 获取订单列表

获取订单列表，支持分页和筛选。

**参数：**
- `page` (可选): 页码，默认 1
- `pageSize` (可选): 每页数量，默认 20
- `status` (可选): 订单状态筛选
- `keyword` (可选): 搜索关键词

**示例：**
```
获取订单列表
获取待处理订单
```

#### get_order_detail - 获取订单详情

获取指定订单的详细信息。

**参数：**
- `orderId` (必需): 订单ID

**示例：**
```
获取订单123的详情
```

#### update_order_status - 更新订单状态

更新指定订单的状态。

**参数：**
- `orderId` (必需): 订单ID
- `status` (必需): 新的订单状态

**示例：**
```
将订单123状态更新为已完成
```

#### claim_order - 认领订单

认领指定订单为自己负责。

**参数：**
- `orderId` (必需): 订单ID

**示例：**
```
认领订单123
```

#### reassign_order - 转派订单

将订单转派给其他人员。

**参数：**
- `orderId` (必需): 订单ID
- `userId` (必需): 目标用户ID

**示例：**
```
将订单123转派给用户456
```

### 4. 用户管理工具

#### get_users - 获取用户列表

获取系统用户列表，支持分页和筛选。

**参数：**
- `page` (可选): 页码，默认 1
- `pageSize` (可选): 每页数量，默认 20
- `role` (可选): 角色筛选
- `keyword` (可选): 搜索关键词

**示例：**
```
获取用户列表
获取客服人员列表
```

#### create_user - 创建用户

创建新的系统用户。

**参数：**
- `name` (必需): 用户姓名
- `email` (必需): 用户邮箱
- `password` (必需): 用户密码
- `role` (必需): 用户角色

**示例：**
```
创建用户张三，邮箱zhangsan@example.com，角色客服
```

### 5. 文档管理工具

#### get_documents - 获取文档列表

获取文档列表，支持分页和筛选。

**参数：**
- `page` (可选): 页码，默认 1
- `pageSize` (可选): 每页数量，默认 20
- `type` (可选): 文档类型筛选
- `keyword` (可选): 搜索关键词

**示例：**
```
获取文档列表
获取签证材料文档
```

#### upload_document - 上传文档

上传新的文档。

**参数：**
- `name` (必需): 文档名称
- `type` (必需): 文档类型
- `content` (必需): 文档内容

**示例：**
```
上传签证申请材料文档
```

### 6. 聊天管理工具

#### get_chat_rooms - 获取聊天房间列表

获取当前用户的聊天房间列表。

**参数：**
- `page` (可选): 页码，默认 1
- `pageSize` (可选): 每页数量，默认 20

**示例：**
```
获取我的聊天房间
```

#### send_chat_message - 发送聊天消息

向指定聊天房间发送消息。

**参数：**
- `roomId` (必需): 聊天房间ID
- `content` (必需): 消息内容

**示例：**
```
向房间123发送消息
```

### 7. 通知管理工具

#### get_notifications - 获取通知列表

获取当前用户的通知列表。

**参数：**
- `page` (可选): 页码，默认 1
- `pageSize` (可选): 每页数量，默认 20
- `unreadOnly` (可选): 只显示未读通知

**示例：**
```
获取我的通知
获取未读通知
```

#### mark_notification_read - 标记通知已读

将指定通知标记为已读。

**参数：**
- `notificationId` (必需): 通知ID

**示例：**
```
标记通知123为已读
```

### 8. 资料需求工具

#### get_document_requirements - 获取资料需求清单

获取指定订单的资料需求清单。

**参数：**
- `orderId` (必需): 订单 ID

**示例：**
```
获取订单123的资料需求清单
```

#### add_document_requirement - 添加资料需求

为指定订单添加资料需求。

**参数：**
- `orderId` (必需): 订单 ID
- `name` (必需): 资料名称
- `description` (可选): 资料说明
- `isRequired` (可选): 是否必填

**示例：**
```
为订单123添加资料需求：护照，说明：有效期6个月以上
```

#### review_document - 审核资料

审核指定的资料文件。

**参数：**
- `documentId` (必需): 资料文件 ID
- `status` (必需): 审核状态，可选值：APPROVED, REJECTED, SUPPLEMENT
- `reason` (可选): 审核原因

**示例：**
```
审核资料文件456，状态为合格
审核资料文件789，状态为需补充，原因：照片不符合要求
```

### 9. AI 工具

#### analyze_document - 分析文档

使用AI分析文档内容、质量和分类。

**参数：**
- `fileId` (必需): 文件 ID
- `analysisType` (必需): 分析类型，可选值：quality, classification, verification

**示例：**
```
分析文件123的质量
分析文件456的分类
```

#### summarize_document - 总结文档

使用AI生成文档内容摘要。

**参数：**
- `fileId` (必需): 文件 ID
- `length` (可选): 摘要长度 (单词数)

**示例：**
```
总结文件123的内容
总结文件456的内容，长度150单词
```

#### compare_documents - 对比文档

使用AI对比两个文档的差异。

**参数：**
- `fileId1` (必需): 第一个文件 ID
- `fileId2` (必需): 第二个文件 ID

**示例：**
```
对比文件123和文件456
```

## 如何使用

### 方式一：使用开发环境状态指示器

在开发环境下，页面右下角会显示 WebMCP 状态指示器，显示：
- 连接状态
- Session ID（前8位）

### 方式二：连接到 AI 应用

按照 https://docs.opentiny.design/next-sdk/guide/mcp-host.html 的说明，将本项目连接到各类 AI 应用：

#### 在 Trae 中配置（推荐）

1. 在 Trae 中使用快捷键 Ctrl + U 弹出 AI 对话框
2. 点击设置按钮进行设置 MCP Servers
3. 添加以下配置：

```json
{
  "mcpServers": {
    "visa-erp-mcp-server": {
      "url": "https://agent.opentiny.design/api/v1/webmcp-trial/mcp?sessionId=你的sessionId"
    }
  }
}
```

注意：需要先启动应用，从开发环境状态指示器或浏览器控制台获取 sessionId。

#### 在 VSCode Copilot 中配置

1. 在项目根目录创建 `.vscode/mcp.json` 文件
2. 添加以下内容：

```json
{
  "servers": {
    "visa-erp-mcp-server": {
      "url": "https://agent.opentiny.design/api/v1/webmcp-trial/mcp?sessionId=你的sessionId"
    }
  }
}
```

## 如何添加新的 MCP 工具

1. 在 `src/webmcp/tools/` 目录下创建新的工具文件
2. 在工具文件中使用 `server.registerTool()` 注册工具
3. 在 `src/webmcp/tools/` 目录下的对应文件中导出注册函数
4. 在 `src/webmcp/WebMcpInitializer.tsx` 中调用注册函数

### 示例：带权限检查的工具

```typescript
// src/webmcp/tools/my-tools.ts
import { getMcpServer } from '../mcp-server'
import { useAuthStore } from '@shared/stores/auth-store'

export const registerMyTools = async () => {
  if (typeof window === 'undefined') return

  const server = getMcpServer()
  if (!server) return

  const { z } = await import('@opentiny/next-sdk')

  server.registerTool(
    'my_tool_name',
    {
      title: '工具标题',
      description: '工具描述',
      inputSchema: {
        param1: z.string().describe('参数1描述'),
        param2: z.number().describe('参数2描述')
      }
    },
    async (params: any) => {
      try {
        const authStore = useAuthStore.getState()
        const role = authStore.role

        if (!role) {
          return {
            content: [{ type: 'text', text: '用户未登录' }]
          }
        }

        // 权限检查
        const { hasPermission } = await import('@shared/lib/rbac')
        if (!hasPermission(role, 'my_resource', 'my_action')) {
          return {
            content: [{ type: 'text', text: '权限不足' }]
          }
        }

        // 工具实现逻辑
        return {
          content: [{ type: 'text', text: '结果' }]
        }
      } catch (error) {
        console.error('工具执行失败:', error)
        return {
          content: [{ type: 'text', text: '执行失败' }]
        }
      }
    }
  )
}
```

## 相关文件参考

- [src/webmcp/mcp-server.ts](file:///workspace/ERP/src/webmcp/mcp-server.ts) - MCP Server 管理
- [src/webmcp/webmcp-client.ts](file:///workspace/ERP/src/webmcp/webmcp-client.ts) - WebMCP Client 管理
- [src/webmcp/WebMcpInitializer.tsx](file:///workspace/ERP/src/webmcp/WebMcpInitializer.tsx) - 初始化组件
- [src/webmcp/tools/visa-tools.ts](file:///workspace/ERP/src/webmcp/tools/visa-tools.ts) - 签证工具
- [src/webmcp/tools/permission-tools.ts](file:///workspace/ERP/src/webmcp/tools/permission-tools.ts) - 权限工具
- [src/webmcp/tools/order-tools.ts](file:///workspace/ERP/src/webmcp/tools/order-tools.ts) - 订单管理工具
- [src/webmcp/tools/user-tools.ts](file:///workspace/ERP/src/webmcp/tools/user-tools.ts) - 用户管理工具
- [src/webmcp/tools/document-tools.ts](file:///workspace/ERP/src/webmcp/tools/document-tools.ts) - 文档管理工具
- [src/webmcp/tools/chat-tools.ts](file:///workspace/ERP/src/webmcp/tools/chat-tools.ts) - 聊天管理工具
- [src/webmcp/tools/notification-tools.ts](file:///workspace/ERP/src/webmcp/tools/notification-tools.ts) - 通知管理工具
- [src/webmcp/tools/document-requirement-tools.ts](file:///workspace/ERP/src/webmcp/tools/document-requirement-tools.ts) - 资料需求管理工具
- [src/webmcp/tools/ai-tools.ts](file:///workspace/ERP/src/webmcp/tools/ai-tools.ts) - AI 工具
- [src/app/layout.tsx](file:///workspace/ERP/src/app/layout.tsx) - 布局集成
- [src/shared/lib/rbac.ts](file:///workspace/ERP/src/shared/lib/rbac.ts) - 权限管理核心逻辑
- [src/shared/lib/rbac-enhanced.ts](file:///workspace/ERP/src/shared/lib/rbac-enhanced.ts) - 增强型权限管理

## 更多信息

- OpenTiny NEXT-SDKs 官方文档：https://docs.opentiny.design/next-sdk/guide/
- MCP Host 配置指南：https://docs.opentiny.design/next-sdk/guide/mcp-host.html
- React 工程最佳实践：https://docs.opentiny.design/next-sdk/guide/react-webmcp-best-practice.html
