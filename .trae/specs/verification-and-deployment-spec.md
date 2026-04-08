# 华夏签证ERP - 全链路验证与部署规范

## Overview
- **Summary**: 对ERP项目进行全链路深度验证，确保之前的修复生效且无新问题，同时检测其他权限账号是否存在相同问题并一并修复，最终推送Git并部署到云服务器。
- **Purpose**: 确保系统稳定性和一致性，验证修复效果，避免引入新问题，保证所有权限账号功能正常。
- **Target Users**: 系统管理员、开发人员、测试人员

## Goals
- 验证资料员账号资料清单实时更新修复是否生效
- 验证资料清单显示完整性
- 验证系统通知角标同步修复是否生效
- 检测其他权限账号是否存在相同问题
- 修复所有发现的问题
- 推送Git并部署到云服务器

## Non-Goals (Out of Scope)
- 重构现有代码架构
- 优化性能或添加新功能
- 修改数据库结构
- 更改部署服务器配置

## Background & Context
- 之前已修复了资料员账号的三个问题：资料清单实时更新、资料清单显示不全、系统通知角标同步
- 系统使用Next.js 15.5.14 + Prisma ORM + MySQL
- 部署在阿里云ECS服务器，使用PM2管理进程
- 权限角色包括：SUPER_ADMIN、COMPANY_OWNER、CS_ADMIN、CUSTOMER_SERVICE、VISA_ADMIN、DOC_COLLECTOR、OPERATOR、OUTSOURCE、CUSTOMER

## Functional Requirements
- **FR-1**: 验证资料员账号的资料清单实时更新功能
- **FR-2**: 验证资料清单显示完整性
- **FR-3**: 验证系统通知角标同步功能
- **FR-4**: 检测其他权限账号是否存在相同问题
- **FR-5**: 修复所有发现的问题
- **FR-6**: 推送Git并部署到云服务器

## Non-Functional Requirements
- **NFR-1**: 验证过程应全面覆盖所有权限角色
- **NFR-2**: 部署过程应确保服务稳定运行
- **NFR-3**: 所有修改应遵循Git提交规范
- **NFR-4**: 部署后应进行健康检查确保服务正常

## Constraints
- **Technical**: 使用现有技术栈和服务器配置
- **Business**: 确保服务不中断，部署时间应合理
- **Dependencies**: 依赖现有服务器环境和Git仓库

## Assumptions
- 服务器环境已正确配置
- Git仓库可正常访问
- 所有权限账号均可正常登录
- 数据库连接正常

## Acceptance Criteria

### AC-1: 资料员账号资料清单实时更新
- **Given**: 资料员登录系统，打开订单详情页
- **When**: 从模板添加或直接添加资料需求
- **Then**: 资料清单卡片实时更新显示新添加的资料
- **Verification**: `human-judgment`

### AC-2: 资料清单显示完整
- **Given**: 资料员登录系统，打开订单详情页
- **When**: 查看包含多个资料项的资料清单
- **Then**: 所有资料项都能完整显示，支持滚动查看
- **Verification**: `human-judgment`

### AC-3: 系统通知角标同步
- **Given**: 资料员登录系统，有未读通知
- **When**: 点击通知铃铛并标记通知为已读
- **Then**: 通知角标数量正确更新
- **Verification**: `human-judgment`

### AC-4: 其他权限账号功能验证
- **Given**: 使用不同权限账号登录系统
- **When**: 执行相同操作（添加资料、查看资料清单、使用通知功能）
- **Then**: 所有功能正常工作，无相同问题
- **Verification**: `human-judgment`

### AC-5: Git推送与部署
- **Given**: 所有问题已修复并验证通过
- **When**: 推送Git并部署到云服务器
- **Then**: 服务正常运行，健康检查通过
- **Verification**: `programmatic`

## Open Questions
- [ ] 具体需要测试哪些权限账号？
- [ ] 部署过程中是否需要停止现有服务？
- [ ] 如何验证其他权限账号的功能？