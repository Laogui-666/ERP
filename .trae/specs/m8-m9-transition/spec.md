# 华夏签证 - M8验收与M9开发计划

## Overview
- **Summary**: 本文件记录M8阶段验收结果和M9阶段（工具模块实装）的产品需求文档。M8阶段已100%完成，M9阶段将实现6大工具模块的完整功能。
- **Purpose**: 确认M8交付物符合PRD要求，规划M9工具模块开发，确保产品从"展示型"向"功能型"过渡。
- **Target Users**: C端签证办理用户、B端员工

## Goals
- ✅ 验收M8阶段所有交付物
- 完成签证资讯工具模块
- 完成行程规划工具模块
- 完成申请表助手工具模块
- 完成签证评估工具模块
- 完成智能翻译工具模块
- 完成证明文件生成工具模块

## Non-Goals (Out of Scope)
- 不涉及ERP系统代码修改（admin/*、customer/*、api/*）
- 不涉及支付集成（M10阶段）
- 不涉及真实AI API对接（先实现UI框架+模拟数据）
- 不涉及工具模块商业化（M11+阶段）

## Background & Context
- M1-M7阶段已完成ERP核心业务系统
- M8阶段已完成C端平台化改造（品牌统一、首页重写、导航体系）
- 当前6大工具页面只有骨架，显示"功能开发中，即将上线"
- 技术栈：Next.js 15.5.14 + React 19.2.4 + Prisma 5.22 + Tailwind 3.4
- 设计系统：液态玻璃 + 莫兰迪冷色系

## Functional Requirements
- **FR-1**: 签证资讯 - 资讯列表、详情页、分类筛选
- **FR-2**: 行程规划 - 目的地输入、AI行程生成、行程展示、编辑保存
- **FR-3**: 申请表助手 - 国家选择、表单智能填写、预览导出
- **FR-4**: 签证评估 - 个人信息输入、AI通过率评估、风险提示
- **FR-5**: 智能翻译 - 多语言输入、即时翻译、历史记录
- **FR-6**: 证明文件 - 模板选择、信息填写、PDF预览生成

## Non-Functional Requirements
- **NFR-1**: 工具页面响应式设计（mobile-first，max-w-lg）
- **NFR-2**: 所有交互符合触控标准（最小44×44px点击区域）
- **NFR-3**: 页面加载<2s（LCP）
- **NFR-4**: 工具数据本地缓存（localStorage）
- **NFR-5**: 符合莫兰迪冷色系设计规范

## Constraints
- **Technical**: 必须遵循ERP零改动原则，仅修改portal/和components/portal/目录
- **Business**: 工具模块先实现UI框架+模拟数据，真实AI集成留待后续
- **Dependencies**: 复用现有共享基础设施（@shared/*、@/lib/*）

## Assumptions
- 用户已登录才能使用工具高级功能（保存、历史记录）
- 未登录用户可体验工具基础功能
- 模拟数据能满足演示需求
- localStorage有足够空间存储用户数据

## Acceptance Criteria

### AC-1: 签证资讯工具
- **Given**: 用户访问/tools/news
- **When**: 页面加载
- **Then**: 显示资讯列表（卡片式，2列网格），支持分类筛选（全部/政策/攻略/新闻）
- **Verification**: `programmatic`
- **Notes**: 资讯数据来自模拟数据，包含封面图、标题、摘要、发布时间

### AC-2: 签证资讯详情
- **Given**: 用户点击资讯卡片
- **When**: 进入详情页
- **Then**: 显示完整资讯内容、返回按钮、分享按钮
- **Verification**: `programmatic`
- **Notes**: 内容支持图片、段落、列表

### AC-3: 行程规划工具
- **Given**: 用户访问/tools/itinerary
- **When**: 输入目的地、出行日期、天数
- **Then**: 生成行程计划（按天展示，包含景点、交通、餐饮、住宿建议）
- **Verification**: `programmatic`
- **Notes**: 行程可编辑、保存到localStorage

### AC-4: 申请表助手
- **Given**: 用户访问/tools/form-helper
- **When**: 选择目标国家、签证类型
- **Then**: 显示对应申请表单，支持智能填写（自动填充已知信息）
- **Verification**: `programmatic`
- **Notes**: 表单支持预览、导出（模拟导出）

### AC-5: 签证评估
- **Given**: 用户访问/tools/assessment
- **When**: 输入个人信息（年龄、职业、出境记录、资产情况）
- **Then**: 显示签证通过率评分（仪表盘）、风险分析、改进建议
- **Verification**: `programmatic`
- **Notes**: 评分基于模拟算法，结果仅供参考

### AC-6: 智能翻译
- **Given**: 用户访问/tools/translator
- **When**: 输入文本，选择源语言和目标语言
- **Then**: 显示翻译结果，支持历史记录（保存最近10条）
- **Verification**: `programmatic`
- **Notes**: 支持中英日韩等常用语言

### AC-7: 证明文件生成
- **Given**: 用户访问/tools/documents
- **When**: 选择模板（在职证明/在读证明/收入证明等）、填写信息
- **Then**: 预览生成的文档，支持导出（模拟PDF导出）
- **Verification**: `programmatic`
- **Notes**: 模板支持自定义公司抬头

### AC-8: 所有工具UI一致性
- **Given**: 用户使用任何工具模块
- **When**: 浏览和交互
- **Then**: 所有工具页面符合莫兰迪冷色系设计规范，液态玻璃组件，响应式布局
- **Verification**: `human-judgment`
- **Notes**: 顶部导航、底部Tab保持一致

## Open Questions
- [ ] 是否需要真实AI API对接预留接口？
- [ ] 工具数据是否需要云端同步（当前仅localStorage）？
- [ ] 是否需要工具使用统计？
