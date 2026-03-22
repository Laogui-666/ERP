import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 0. 创建系统级公司（超级管理员归属）
  const systemCompany = await prisma.company.upsert({
    where: { id: 'system' },
    update: {},
    create: {
      id: 'system',
      name: '系统管理',
      status: 'ACTIVE',
    },
  })
  console.log('✅ System company created:', systemCompany.name)

  // 1. 创建系统级超级管理员
  const superAdmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      companyId: 'system',
      username: 'superadmin',
      phone: '13800000000',
      passwordHash: await bcrypt.hash('Admin@123456', 12),
      realName: '系统管理员',
      role: 'SUPER_ADMIN',
    },
  })
  console.log('✅ Super admin created:', superAdmin.username)

  // 2. 创建预置签证模板
  const templates = [
    {
      name: '申根国家旅游签证材料清单',
      country: '申根国家',
      visaType: '旅游',
      items: [
        { name: '护照', description: '有效期6个月以上，至少2页空白页', required: true },
        { name: '照片', description: '2寸白底近照 35×45mm', required: true },
        { name: '在职证明', description: '公司抬头信纸，加盖公章', required: true },
        { name: '银行流水', description: '近6个月银行流水，余额建议5万+', required: true },
        { name: '行程单', description: '往返机票预订 + 每日行程安排', required: true },
        { name: '酒店预订单', description: '覆盖全部行程的酒店预订确认', required: true },
        { name: '旅行保险', description: '保额3万欧以上的申根保险', required: true },
        { name: '户口本复印件', description: '整本复印', required: false },
      ],
    },
    {
      name: '美国B1/B2签证材料清单',
      country: '美国',
      visaType: '旅游/商务',
      items: [
        { name: 'DS-160确认页', description: '在线填写并打印确认页', required: true },
        { name: '护照', description: '有效期6个月以上', required: true },
        { name: '照片', description: '51×51mm 白底近照', required: true },
        { name: '在职证明', description: '公司抬头信纸', required: true },
        { name: '资产证明', description: '房产证、车辆登记证、银行流水等', required: true },
        { name: '行程计划', description: '大致行程安排', required: false },
      ],
    },
    {
      name: '日本单次旅游签证材料清单',
      country: '日本',
      visaType: '单次旅游',
      items: [
        { name: '护照', description: '有效期6个月以上', required: true },
        { name: '照片', description: '4.5×4.5cm 白底近照', required: true },
        { name: '在职证明', description: '公司抬头信纸', required: true },
        { name: '银行流水', description: '近6个月流水，年收入10万+', required: true },
        { name: '行程表', description: '每日行程安排', required: true },
        { name: '酒店预订', description: '酒店预订确认', required: true },
      ],
    },
  ]

  for (const template of templates) {
    await prisma.visaTemplate.create({
      data: {
        companyId: 'system',
        name: template.name,
        country: template.country,
        visaType: template.visaType,
        items: template.items,
        isSystem: true,
        createdBy: superAdmin.id,
      },
    })
    console.log(`✅ Template created: ${template.name}`)
  }

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
