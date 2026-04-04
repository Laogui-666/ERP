/**
 * 全量重置脚本：清空数据 + 创建9级角色测试账号
 * 
 * 警告：此脚本会删除所有业务数据！
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const PASSWORD = 'Test@123456'

async function main() {
  console.log('⚠️  开始全量数据重置...\n')

  // ========== 1. 清空所有业务数据（按依赖顺序） ==========
  console.log('🗑️  清空数据...')

  await prisma.chatRead.deleteMany()
  console.log('  ✅ chat_reads 清空')

  await prisma.chatMessage.deleteMany()
  console.log('  ✅ chat_messages 清空')

  await prisma.chatRoom.deleteMany()
  console.log('  ✅ chat_rooms 清空')

  await prisma.notification.deleteMany()
  console.log('  ✅ notifications 清空')

  await prisma.orderLog.deleteMany()
  console.log('  ✅ order_logs 清空')

  await prisma.documentFile.deleteMany()
  console.log('  ✅ document_files 清空')

  await prisma.documentRequirement.deleteMany()
  console.log('  ✅ document_requirements 清空')

  await prisma.visaMaterial.deleteMany()
  console.log('  ✅ visa_materials 清空')

  await prisma.applicant.deleteMany()
  console.log('  ✅ applicants 清空')

  await prisma.order.deleteMany()
  console.log('  ✅ orders 清空')

  await prisma.visaTemplate.deleteMany()
  console.log('  ✅ visa_templates 清空')

  await prisma.newsArticle.deleteMany()
  console.log('  ✅ news_articles 清空')

  await prisma.itinerary.deleteMany()
  console.log('  ✅ itineraries 清空')

  await prisma.formRecord.deleteMany()
  console.log('  ✅ form_records 清空')

  await prisma.formTemplate.deleteMany()
  console.log('  ✅ form_templates 清空')

  await prisma.visaAssessment.deleteMany()
  console.log('  ✅ visa_assessments 清空')

  await prisma.translationRequest.deleteMany()
  console.log('  ✅ translation_requests 清空')

  await prisma.generatedDocument.deleteMany()
  console.log('  ✅ generated_documents 清空')

  await prisma.docHelperTemplate.deleteMany()
  console.log('  ✅ doc_helper_templates 清空')

  // 删除所有非系统公司的用户
  await prisma.user.deleteMany()
  console.log('  ✅ users 清空')

  await prisma.department.deleteMany()
  console.log('  ✅ departments 清空')

  await prisma.company.deleteMany()
  console.log('  ✅ companies 清空')

  console.log('\n📦 数据清空完成！\n')

  // ========== 2. 创建公司 ==========
  console.log('🏢 创建公司...')

  // 系统公司（superadmin 必须依赖）
  const systemCompany = await prisma.company.create({
    data: {
      id: 'system',
      name: '系统管理',
      status: 'ACTIVE',
    },
  })
  console.log(`  ✅ 系统公司：${systemCompany.name}`)

  // 测试业务公司
  const company = await prisma.company.create({
    data: {
      id: 'test-company-001',
      name: '华夏签证测试公司',
      phone: '400-888-8888',
      email: 'test@huaxia-visa.com',
      address: '北京市朝阳区测试大厦1001室',
      status: 'ACTIVE',
    },
  })
  console.log(`  ✅ 测试公司：${company.name}`)

  // ========== 3. 创建部门 ==========
  console.log('\n🏛️  创建部门...')

  const csDept = await prisma.department.create({
    data: {
      companyId: company.id,
      name: '客服部',
      code: 'CS',
      sortOrder: 1,
    },
  })

  const visaDept = await prisma.department.create({
    data: {
      companyId: company.id,
      name: '签证部',
      code: 'VISA',
      sortOrder: 2,
    },
  })

  const mgmtDept = await prisma.department.create({
    data: {
      companyId: company.id,
      name: '管理层',
      code: 'MANAGEMENT',
      sortOrder: 0,
    },
  })

  console.log(`  ✅ 客服部 (ID: ${csDept.id})`)
  console.log(`  ✅ 签证部 (ID: ${visaDept.id})`)
  console.log(`  ✅ 管理层 (ID: ${mgmtDept.id})`)

  // ========== 4. 创建9级角色测试账号 ==========
  console.log('\n👥 创建9级角色测试账号...')

  const passwordHash = await bcrypt.hash(PASSWORD, 12)

  const accounts = [
    {
      username: 'superadmin',
      realName: '超级管理员',
      phone: '13800000001',
      role: 'SUPER_ADMIN' as const,
      departmentId: null,
      companyId: 'system',
    },
    {
      username: 'owner',
      realName: '企业主-张总',
      phone: '13800000002',
      role: 'COMPANY_OWNER' as const,
      departmentId: mgmtDept.id,
      companyId: company.id,
    },
    {
      username: 'cs_admin',
      realName: '客服主管-李主管',
      phone: '13800000003',
      role: 'CS_ADMIN' as const,
      departmentId: csDept.id,
      companyId: company.id,
    },
    {
      username: 'cs_staff',
      realName: '客服-王小美',
      phone: '13800000004',
      role: 'CUSTOMER_SERVICE' as const,
      departmentId: csDept.id,
      companyId: company.id,
    },
    {
      username: 'visa_admin',
      realName: '签证主管-赵主管',
      phone: '13800000005',
      role: 'VISA_ADMIN' as const,
      departmentId: visaDept.id,
      companyId: company.id,
    },
    {
      username: 'collector',
      realName: '资料员-刘资料',
      phone: '13800000006',
      role: 'DOC_COLLECTOR' as const,
      departmentId: visaDept.id,
      companyId: company.id,
    },
    {
      username: 'operator',
      realName: '操作员-陈操作',
      phone: '13800000007',
      role: 'OPERATOR' as const,
      departmentId: visaDept.id,
      companyId: company.id,
    },
    {
      username: 'outsourcer',
      realName: '外包人员-周外包',
      phone: '13800000008',
      role: 'OUTSOURCE' as const,
      departmentId: visaDept.id,
      companyId: company.id,
    },
    {
      username: 'customer',
      realName: '客户-孙旅客',
      phone: '13800000009',
      role: 'CUSTOMER' as const,
      departmentId: null,
      companyId: company.id,
    },
  ]

  for (const account of accounts) {
    const user = await prisma.user.create({
      data: {
        companyId: account.companyId,
        departmentId: account.departmentId,
        username: account.username,
        phone: account.phone,
        passwordHash,
        realName: account.realName,
        role: account.role,
        status: 'ACTIVE',
      },
    })
    console.log(`  ✅ ${account.role.padEnd(20)} | ${account.username.padEnd(14)} | ${account.realName}`)
  }

  // ========== 5. 创建系统预置签证模板 ==========
  console.log('\n📝 创建预置签证模板...')

  const superadminUser = await prisma.user.findUnique({ where: { username: 'superadmin' } })

  const templates = [
    {
      name: '申根旅游签证材料清单',
      country: '申根国家',
      visaType: '旅游',
      items: [
        { name: '护照', description: '有效期6个月以上，至少2页空白页', required: true },
        { name: '照片', description: '2寸白底近照 3.5×4.5cm', required: true },
        { name: '在职证明', description: '公司抬头纸，加盖公章', required: true },
        { name: '银行流水', description: '近6个月，余额5万以上', required: true },
        { name: '行程单', description: '每日行程安排', required: true },
        { name: '酒店预订单', description: '覆盖全部行程', required: true },
        { name: '机票预订单', description: '往返机票', required: true },
        { name: '旅行保险', description: '保额3万欧以上', required: true },
        { name: '户口本复印件', description: '整本复印', required: false },
      ],
    },
    {
      name: '美国B1/B2签证材料清单',
      country: '美国',
      visaType: 'B1/B2',
      items: [
        { name: '护照', description: '有效期6个月以上', required: true },
        { name: 'DS-160确认页', description: '在线填写并打印', required: true },
        { name: '照片', description: '51×51mm 白底', required: true },
        { name: '在职证明', description: '公司开具', required: true },
        { name: '资产证明', description: '房产/车产/存款', required: false },
        { name: '行程计划', description: '旅行计划说明', required: true },
        { name: '邀请函', description: '如有邀请方', required: false },
      ],
    },
    {
      name: '日本单次旅游签证材料清单',
      country: '日本',
      visaType: '单次旅游',
      items: [
        { name: '护照', description: '有效期6个月以上', required: true },
        { name: '照片', description: '2寸白底 4.5×4.5cm', required: true },
        { name: '在职证明', description: '含收入证明', required: true },
        { name: '银行流水', description: '近6个月', required: true },
        { name: '行程表', description: '每日行程', required: true },
        { name: '酒店预订', description: '覆盖行程', required: true },
        { name: '机票预订', description: '往返', required: true },
      ],
    },
  ]

  for (const tpl of templates) {
    await prisma.visaTemplate.create({
      data: {
        companyId: company.id,
        name: tpl.name,
        country: tpl.country,
        visaType: tpl.visaType,
        items: tpl.items,
        isSystem: true,
        createdBy: superadminUser?.id ?? 'system',
      },
    })
    console.log(`  ✅ ${tpl.name}`)
  }

  // 创建系统助手（聊天系统消息发送者，无密码，不可登录）
  await prisma.user.create({
    data: {
      id: 'chat_system',
      companyId: 'system',
      username: 'chat_system',
      phone: '13800000000',
      passwordHash: '***NO_LOGIN***',
      realName: '系统助手',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  })
  console.log(`  ✅ 系统助手 chat_system（不可登录）`)

  // ========== 完成 ==========
  console.log('\n' + '='.repeat(60))
  console.log('🎉 全量重置完成！')
  console.log('='.repeat(60))
  console.log('\n📋 9级角色测试账号：')
  console.log('─'.repeat(60))
  console.log(`  ${'级别'.padEnd(6)} ${'角色'.padEnd(22)} ${'用户名'.padEnd(16)} ${'姓名'}`)
  console.log('─'.repeat(60))

  const roleNames: Record<string, string> = {
    SUPER_ADMIN: '超级管理员',
    COMPANY_OWNER: '企业主',
    CS_ADMIN: '客服主管',
    CUSTOMER_SERVICE: '客服',
    VISA_ADMIN: '签证主管',
    DOC_COLLECTOR: '资料员',
    OPERATOR: '操作员',
    OUTSOURCE: '外包人员',
    CUSTOMER: '客户',
  }

  for (const a of accounts) {
    const level = ['Lv1', 'Lv2', 'Lv3', 'Lv4', 'Lv5', 'Lv6', 'Lv7', 'Lv8', 'Lv9'][
      accounts.indexOf(a)
    ]
    console.log(`  ${level.padEnd(6)} ${roleNames[a.role].padEnd(22)} ${a.username.padEnd(16)} ${a.realName}`)
  }

  console.log('─'.repeat(60))
  console.log(`\n🔑 统一密码：${PASSWORD}`)
  console.log(`🏢 测试公司：${company.name}`)
  console.log(`📁 预置模板：${templates.length} 个签证材料模板`)
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
