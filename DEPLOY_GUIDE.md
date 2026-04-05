# 华夏签证ERP系统部署指南

## 📋 部署前准备

### 已完成
- ✅ 项目代码已推送到Git仓库
- ✅ 部署脚本已创建：`deploy.sh`
- ✅ TypeScript类型检查通过
- ✅ 项目构建成功

---

## 🚀 部署步骤

### 方法一：宝塔面板手动部署（推荐）

#### 1. 登录宝塔面板
访问：`http://223.6.248.154:8888`

#### 2. 打开终端
在宝塔面板左侧菜单 → **终端**

#### 3. 进入项目目录
```bash
cd /www/wwwroot/ERP
```

#### 4. 拉取最新代码
```bash
git pull origin main
```

#### 5. 执行部署脚本
```bash
chmod +x deploy.sh
./deploy.sh
```

---

### 方法二：宝塔面板Shell脚本执行

#### 1. 登录宝塔面板
访问：`http://223.6.248.154:8888`

#### 2. 打开计划任务
左侧菜单 → **计划任务**

#### 3. 添加Shell脚本任务
- 任务类型：**Shell脚本**
- 任务名称：**华夏签证ERP部署**
- 执行周期：**N分钟** → 1分钟（执行后删除）
- 脚本内容：
```bash
cd /www/wwwroot/ERP
git pull origin main
chmod +x deploy.sh
./deploy.sh
```

#### 4. 执行任务
点击 **添加任务** → 然后点击 **执行**

---

## 📝 部署脚本内容（deploy.sh）

```bash
#!/bin/bash

set -e

echo "=== 开始部署华夏签证ERP系统 ==="

cd /www/wwwroot/ERP

echo "1. 拉取最新代码..."
git pull origin main

echo "2. 安装依赖..."
npm ci

echo "3. 生成 Prisma Client..."
npx prisma generate

echo "4. 构建项目..."
npm run build

echo "5. 重启服务..."
pm2 stop erp || true
npm run start > /dev/null 2>&1 &

echo "6. 验证服务状态..."
sleep 5
curl -s http://localhost:3002/api/health

echo -e "\n=== 部署完成！==="
echo "访问地址: http://223.6.248.154:3002"
```

---

## 🔍 实机测试步骤

### 1. 访问系统
打开浏览器访问：`http://223.6.248.154:3002`

### 2. 登录测试
- 访问登录页：`http://223.6.248.154:3002/login`
- 使用超级管理员账号：
  - 用户名：`superadmin`
  - 密码：`Admin@123456`

### 3. 功能测试清单

#### 3.1 基础功能
- [ ] 登录成功，跳转到首页
- [ ] 侧边栏菜单显示正常
- [ ] 仪表盘加载正常

#### 3.2 订单管理
- [ ] 订单列表显示正常
- [ ] 创建订单表单可以打开
- [ ] 订单状态流转正常

#### 3.3 资料管理
- [ ] 资料面板显示正常
- [ ] 文件上传功能正常

#### 3.4 通知系统
- [ ] 通知铃铛显示未读数
- [ ] 通知列表加载正常

#### 3.5 健康检查
- [ ] 访问 `http://223.6.248.154:3002/api/health` 返回正常

---

## 🚨 常见问题

### Q1: pm2命令不存在？
**A:** 安装pm2：
```bash
npm install -g pm2
```

### Q2: 端口3002被占用？
**A:** 检查并停止占用端口的进程：
```bash
lsof -i :3002
kill -9 <进程ID>
```

### Q3: 构建失败？
**A:** 清除缓存重新构建：
```bash
rm -rf node_modules .next
npm install
npm run build
```

### Q4: Git拉取失败？
**A:** 检查Git配置：
```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

---

## 📞 技术支持

如果遇到问题，请检查：
1. Node.js版本 >= 20.x
2. npm版本最新
3. 服务器内存充足（至少2GB）
4. 磁盘空间充足（至少10GB）

---

## ✅ 部署完成验证

部署成功后，您应该看到：
- 终端显示：`=== 部署完成！===`
- 访问 `http://223.6.248.154:3002` 可以打开系统
- 健康检查API返回正常响应
- 可以正常登录和使用各项功能

---

**祝部署顺利！🎉**
