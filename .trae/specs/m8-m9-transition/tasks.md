# 华夏签证 - M9工具模块实装任务清单

## [x] 任务1: 签证资讯工具开发
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 创建资讯列表页面（2列网格，卡片式展示）
  - 实现分类筛选（全部/政策/攻略/新闻）
  - 创建资讯详情页面
  - 准备模拟资讯数据（10-15条）
  - 实现资讯数据Store（Zustand）
- **Acceptance Criteria Addressed**: AC-1, AC-2
- **Test Requirements**:
  - `programmatic` TR-1.1: 资讯列表正常加载，显示10+条数据
  - `programmatic` TR-1.2: 分类筛选功能正常，点击不同分类显示对应资讯
  - `programmatic` TR-1.3: 点击资讯卡片正常跳转到详情页
  - `human-judgement` TR-1.4: UI符合莫兰迪设计规范，响应式布局正常
- **Notes**: 使用模拟数据，先不连接真实API

## [x] 任务2: 行程规划工具开发
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 创建行程规划主页面
  - 实现目的地、日期、天数输入表单
  - 实现行程生成算法（模拟AI）
  - 创建行程展示组件（按天卡片式）
  - 实现行程编辑和保存功能（localStorage）
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `programmatic` TR-2.1: 输入表单正常显示和交互
  - `programmatic` TR-2.2: 点击"生成行程"后显示完整行程计划
  - `programmatic` TR-2.3: 行程保存到localStorage，刷新页面后数据不丢失
  - `human-judgement` TR-2.4: 行程展示清晰，每天包含景点、交通、餐饮、住宿建议

## [x] 任务3: 申请表助手工具开发
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 创建申请表助手主页面
  - 实现国家和签证类型选择器
  - 创建动态表单生成组件（根据国家/类型显示不同字段）
  - 实现智能填写逻辑（自动填充已知用户信息）
  - 实现表单预览和导出功能（模拟导出）
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `programmatic` TR-3.1: 国家和签证类型选择器正常工作
  - `programmatic` TR-3.2: 选择不同国家显示对应的表单字段
  - `programmatic` TR-3.3: 表单填写和预览功能正常
  - `human-judgement` TR-3.4: 表单布局清晰，符合移动端设计规范

## [x] 任务4: 签证评估工具开发
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 创建签证评估主页面
  - 实现个人信息输入表单（年龄、职业、出境记录、资产情况）
  - 实现评分算法（模拟AI评估）
  - 创建仪表盘组件显示通过率
  - 实现风险分析和改进建议展示
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `programmatic` TR-4.1: 信息输入表单正常显示和交互
  - `programmatic` TR-4.2: 点击"开始评估"后显示评分和分析结果
  - `programmatic` TR-4.3: 仪表盘动画效果流畅
  - `human-judgement` TR-4.4: 风险分析和改进建议清晰易懂

## [x] 任务5: 智能翻译工具开发
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 创建智能翻译主页面
  - 实现语言选择器（源语言/目标语言）
  - 实现文本输入和翻译结果展示
  - 实现历史记录功能（保存最近10条）
  - 准备模拟翻译数据
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `programmatic` TR-5.1: 语言选择器正常工作，支持中英日韩等语言
  - `programmatic` TR-5.2: 输入文本后点击翻译显示结果
  - `programmatic` TR-5.3: 翻译历史记录正常保存和显示
  - `human-judgement` TR-5.4: 界面简洁直观，符合移动端使用习惯

## [x] 任务6: 证明文件生成工具开发
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 创建证明文件生成主页面
  - 实现模板选择器（在职证明/在读证明/收入证明等）
  - 实现信息填写表单
  - 创建文档预览组件
  - 实现导出功能（模拟PDF导出）
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `programmatic` TR-6.1: 模板选择器正常工作
  - `programmatic` TR-6.2: 选择模板后显示对应的填写表单
  - `programmatic` TR-6.3: 填写信息后预览功能正常显示
  - `human-judgement` TR-6.4: 文档预览美观，格式正确

## [x] 任务7: 工具模块UI统一优化
- **Priority**: P1
- **Depends On**: 任务1,任务2,任务3,任务4,任务5,任务6
- **Description**: 
  - 统一所有工具页面的顶部导航
  - 统一所有工具页面的布局结构
  - 添加加载骨架屏
  - 添加空状态页面
  - 优化移动端触控体验
- **Acceptance Criteria Addressed**: AC-8
- **Test Requirements**:
  - `human-judgement` TR-7.1: 所有工具页面UI风格一致
  - `human-judgement` TR-7.2: 所有工具页面顶部导航统一
  - `programmatic` TR-7.3: 加载状态和空状态正常显示
  - `human-judgement` TR-7.4: 移动端触控体验流畅，无卡顿

## [x] 任务8: 全量测试与验收
- **Priority**: P0
- **Depends On**: 任务7
- **Description**: 
  - 运行TypeScript类型检查
  - 运行完整构建
  - 运行单元测试
  - 手动测试所有工具模块
  - 验证ERP功能零影响
- **Acceptance Criteria Addressed**: AC-1,AC-2,AC-3,AC-4,AC-5,AC-6,AC-7,AC-8
- **Test Requirements**:
  - `programmatic` TR-8.1: TypeScript 0错误
  - `programmatic` TR-8.2: npm run build通过
  - `programmatic` TR-8.3: 所有91个测试用例通过
  - `human-judgement` TR-8.4: ERP管理端和客户端功能正常
  - `human-judgement` TR-8.5: 所有工具模块功能完整，UI美观
