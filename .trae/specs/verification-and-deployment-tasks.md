# 华夏签证ERP - 全链路验证与部署任务计划

## [x] Task 1: 验证资料员账号资料清单实时更新功能
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 登录资料员账号
  - 打开订单详情页
  - 从模板添加资料需求
  - 直接添加资料需求
  - 验证资料清单是否实时更新
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `human-judgment` TR-1.1: 从模板添加资料后，资料清单应立即显示新资料 ✓
  - `human-judgment` TR-1.2: 直接添加资料后，资料清单应立即显示新资料 ✓
- **Notes**: 测试时确保网络连接稳定

## [x] Task 2: 验证资料清单显示完整性
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 登录资料员账号
  - 打开包含多个资料项的订单
  - 验证所有资料项是否完整显示
  - 测试滚动功能
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `human-judgment` TR-2.1: 资料清单弹窗应显示所有资料项 ✓
  - `human-judgment` TR-2.2: 当资料项过多时，应支持滚动查看 ✓
- **Notes**: 测试时可以创建多个资料项进行验证

## [x] Task 3: 验证系统通知角标同步功能
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 登录资料员账号
  - 确保有未读通知
  - 点击通知铃铛查看通知
  - 标记通知为已读
  - 验证角标数量是否正确更新
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `human-judgment` TR-3.1: 标记通知为已读后，角标应立即更新 ✓
  - `human-judgment` TR-3.2: 所有通知标记为已读后，角标应消失 ✓
- **Notes**: 测试时可以创建测试通知

## [x] Task 4: 检测其他权限账号资料清单功能
- **Priority**: P1
- **Depends On**: Task 1, Task 2
- **Description**: 
  - 登录不同权限账号（VISA_ADMIN、OPERATOR、CUSTOMER_SERVICE等）
  - 测试资料清单的添加和显示功能
  - 检测是否存在相同问题
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `human-judgment` TR-4.1: 不同权限账号添加资料后资料清单应实时更新 ✓
  - `human-judgment` TR-4.2: 不同权限账号查看资料清单应完整显示 ✓
- **Notes**: 重点测试与资料员权限相近的角色

## [x] Task 5: 检测其他权限账号通知功能
- **Priority**: P1
- **Depends On**: Task 3
- **Description**: 
  - 登录不同权限账号
  - 测试通知功能和角标同步
  - 检测是否存在相同问题
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `human-judgment` TR-5.1: 不同权限账号的通知角标应正确同步 ✓
  - `human-judgment` TR-5.2: 标记通知为已读后角标应正确更新 ✓
- **Notes**: 重点测试所有有权限查看通知的角色

## [x] Task 6: 修复发现的问题
- **Priority**: P0
- **Depends On**: Task 4, Task 5
- **Description**: 
  - 修复其他权限账号发现的问题
  - 确保修复方案与之前的修复保持一致
  - 测试修复效果
- **Acceptance Criteria Addressed**: AC-4, AC-5
- **Test Requirements**:
  - `human-judgment` TR-6.1: 修复后所有权限账号功能应正常 ✓
  - `programmatic` TR-6.2: 修复后TypeScript类型检查应通过 ✓
- **Notes**: 修复时注意保持代码风格一致性

## [x] Task 7: 推送Git并部署到云服务器
- **Priority**: P0
- **Depends On**: Task 6
- **Description**: 
  - 执行Git推送（遵循提交规范）
  - 运行部署脚本部署到云服务器
  - 进行健康检查确保服务正常
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `programmatic` TR-7.1: Git推送应成功
  - `programmatic` TR-7.2: 部署脚本应执行成功
  - `programmatic` TR-7.3: 服务健康检查应通过
- **Notes**: 部署前确保所有修改已测试通过