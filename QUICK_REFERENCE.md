# 华夏签证ERP - 快速参考手册

## 🚀 一键部署（最常用）

```bash
cd /workspace/ERP
./scripts/push-and-deploy.sh "fix(scope): 描述你的修改"
```

---

## 📋 分步部署

### 1. 本地验证
```bash
npm run type-check    # 类型检查
npm run test          # 运行测试
npm run build         # 构建验证
```

### 2. Git提交
```bash
git add -A
git commit -m "type(scope): description"
git push origin main
```

### 3. 服务器部署
```bash
python3 scripts/deploy-complete.py
```

---

## 🎯 Git提交规范

### 格式
```
type(scope): description
```

### Type类型
| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复Bug |
| `refactor` | 重构 |
| `style` | 代码格式 |
| `docs` | 文档更新 |
| `chore` | 配置变更 |
| `test` | 测试相关 |

### Scope模块
| 模块 | 说明 |
|------|------|
| `customer` | 客户端 |
| `admin` | 管理端 |
| `portal` | 门户页面 |
| `api` | 后端接口 |
| `db` | 数据库 |
| `auth` | 认证模块 |
| `chat` | 聊天模块 |
| `order` | 订单模块 |

### 示例
```bash
git commit -m "fix(customer): 修复底部Tab导航"
git commit -m "feat(admin): 新增订单导出"
git commit -m "refactor(api): 优化查询性能"
```

---

## 🔧 服务器信息

| 配置项 | 值 |
|--------|-----|
| 公网IP | 223.6.248.154 |
| 端口 | 3002 |
| 访问地址 | http://223.6.248.154:3002 |
| SSH用户 | root |
| 项目路径 | /www/wwwroot/ERP |
| PM2进程 | erp |

---

## 📞 常用命令

### 本地开发
```bash
npm run dev           # 启动开发服务器
npm run type-check    # 类型检查
npm run test          # 运行测试
npm run build         # 构建项目
```

### Git操作
```bash
git status            # 查看状态
git diff              # 查看变更
git log --oneline     # 查看提交历史
```

### PM2操作（服务器上）
```bash
pm2 list              # 查看进程列表
pm2 logs erp          # 查看日志
pm2 restart erp       # 重启服务
pm2 stop erp          # 停止服务
```

---

## ⚠️ 注意事项

1. **始终在main分支开发和部署**
2. **部署前必须通过本地验证**
3. **不要提交敏感信息到Git**
4. **重要修改前建议备份**

---

## 📚 更多文档

- [完整部署工作流](./DEPLOYMENT_WORKFLOW.md)
- [产品需求文档](./docs/01-PRD.md)
- [架构设计文档](./docs/02-architecture.md)
- [项目状态文档](./docs/03-project-status.md)

---

**最后更新**: 2026-04-08
