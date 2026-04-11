#!/usr/bin/env npx tsx
/**
 * 沐海旅行 ERP — 历史数据导入脚本（M5 批次 7）
 *
 * 用途：将手工 Excel 统计表批量导入 ERP 数据库
 * 用法：
 *   npx tsx scripts/import-excel.ts <excel文件路径> [--dry-run] [--sheet "2026年3月"]
 *
 * 功能：
 *   - 读取 Excel 所有工作表
 *   - 第 2 行为表头（第 1 行标题跳过）
 *   - 列名模糊匹配（不要求精确匹配）
 *   - B 列合并单元格检测 → 识别多人订单
 *   - Excel 序列号日期 → JS Date
 *   - 支付方式 13 种标准化为 5 种
 *   - 平台扣点 "6.1%" → 0.061
 *   - dry-run 模式预览后再写入
 */

import { PrismaClient } from '@prisma/client'
import type { Prisma } from '@prisma/client';
import * as XLSX from 'xlsx'
import * as path from 'path'
import * as crypto from 'crypto'

const prisma = new PrismaClient()

// ==================== 配置区 ====================

/** 跳过的异常表名 */
const SKIP_SHEETS = ['1月（已统计）', '1月(已统计)', 'Sheet1']

/** 客服/资料员姓名 → userId 映射（运行时自动从数据库加载） */
const NAME_MAP: Record<string, string> = {}

/** 支付方式标准化映射 */
const PAYMENT_STANDARDIZE: Record<string, string> = {
  '支付宝': 'ALIPAY',
  '花呗': 'HUABEI',
  '花呗支付': 'HUABEI',
  '信用支付': 'CREDIT',
  '分期购': 'CREDIT',
  '盼达二维码': 'WECHAT',
  '华夏二维码': 'WECHAT',
  '华夏收款码': 'WECHAT',
  '企业二维码': 'WECHAT',
  '华夏企业微信': 'WECHAT',
  '企业微信收': 'WECHAT',
  '小红书': 'WECHAT',
  '生哥现收': 'CASH',
}

// ==================== 列名模糊匹配 ====================

/** 列名关键词 → ERP 字段映射 */
const COLUMN_KEYWORDS: Record<string, string[]> = {
  contactName: ['联系人'],
  applicantName: ['申请人'],
  phone: ['手机号', '电话'],
  country: ['国家'],
  city: ['城市'],
  category: ['套餐', '签证类型'],
  remark: ['备注', '预计出行', '邮箱'],
  createdAt: ['下单时间', '进件时间'],
  createdBy: ['接待客服', '客服'],
  collector: ['资料收集', '资料员'],
  status: ['平台进度', '进度'],
  submittedAt: ['递交日期', '递交时间'],
  visaResultAt: ['出签时间', '出签日期'],
  operator: ['操作专员', '操作员'],
  externalOrderNo: ['订单编号', '订单号'],
  amount: ['订单金额', '金额'],
  paymentMethod: ['支付方式'],
  platformFeeRate: ['平台扣点', '扣点'],
  platformFee: ['平台费用'],
  visaFee: ['签证费'],
  insuranceFee: ['申根保险', '保险费'],
  rejectionInsurance: ['拒签保险'],
}

/**
 * 模糊匹配表头列名
 * @returns 列索引 → ERP 字段名 的映射
 */
function matchColumns(headers: string[]): Map<number, string> {
  const result = new Map<number, string>()

  for (let col = 0; col < headers.length; col++) {
    const header = String(headers[col] ?? '').trim()
    if (!header) continue

    for (const [field, keywords] of Object.entries(COLUMN_KEYWORDS)) {
      if (keywords.some(kw => header.includes(kw))) {
        result.set(col, field)
        break
      }
    }
  }

  return result
}

// ==================== 工具函数 ====================

/**
 * Excel 序列号日期 → JS Date
 * Excel 使用 1900 日期系统，序列号 1 = 1900-01-01
 * 注意：Excel 错误地认为 1900 是闰年，需要修正
 */
function excelDateToJS(excelDate: number): Date | null {
  if (!excelDate || excelDate <= 0) return null
  // 25569 = 1970-01-01 的 Excel 序列号
  const ms = (excelDate - 25569) * 86400000
  const date = new Date(ms)
  if (isNaN(date.getTime())) return null
  return date
}

/**
 * 平台扣点标准化
 * "6.1%" → 0.061, "0.061" → 0.061, 0 → 0
 */
function parseFeeRate(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null

  if (typeof value === 'number') {
    if (value > 1) return value / 100 // 6.1 → 0.061
    return value // 0.061 → 0.061
  }

  const str = String(value).trim()
  if (!str || str === '0') return 0

  // "6.1%" → 0.061
  if (str.endsWith('%')) {
    const num = parseFloat(str.replace('%', ''))
    return isNaN(num) ? null : num / 100
  }

  const num = parseFloat(str)
  return isNaN(num) ? null : (num > 1 ? num / 100 : num)
}

/**
 * 支付方式标准化
 */
function standardizePayment(value: unknown): string | null {
  if (!value) return null
  const str = String(value).trim()
  return PAYMENT_STANDARDIZE[str] ?? str
}

/**
 * 安全获取单元格值
 */
function getCell(worksheet: XLSX.WorkSheet, row: number, col: number): unknown {
  const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
  const cell = worksheet[cellRef]
  return cell?.v ?? null
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date: Date | null): string {
  if (!date) return '-'
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 格式化金额
 */
function formatAmount(value: unknown): string {
  if (value === null || value === undefined) return '-'
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  return isNaN(num) ? String(value) : `¥${num.toLocaleString()}`
}

// ==================== 合并单元格检测 ====================

/**
 * 检测 B 列的合并单元格，返回每个数据行所属的合并范围
 * @returns Map<行号, { startRow, endRow }> 表示该行属于哪个合并范围
 */
function detectMergedRanges(
  worksheet: XLSX.WorkSheet,
  headerRow: number,
  totalRows: number
): Map<number, { startRow: number; endRow: number }> {
  const result = new Map<number, { startRow: number; endRow: number }>()
  const merges = worksheet['!merges'] ?? []

  // 初始化：每行默认独立范围
  for (let r = headerRow + 1; r < headerRow + 1 + totalRows; r++) {
    result.set(r, { startRow: r, endRow: r })
  }

  // 查找 B 列（index=1）的合并范围
  for (const merge of merges) {
    if (merge.s.c === 1 && merge.e.c === 1) {
      // B 列合并范围
      const startRow = merge.s.r
      const endRow = merge.e.r
      for (let r = startRow; r <= endRow; r++) {
        result.set(r, { startRow, endRow })
      }
    }
  }

  return result
}

// ==================== 主解析逻辑 ====================

interface ParsedOrder {
  contactName: string
  customerPhone: string
  targetCountry: string
  targetCity: string | null
  visaCategory: string | null
  remark: string | null
  createdAt: Date | null
  createdBy: string | null // 原始姓名
  collectorName: string | null
  submittedAt: Date | null
  operatorName: string | null
  externalOrderNo: string | null
  amount: number
  paymentMethod: string | null
  platformFeeRate: number | null
  platformFee: number | null
  visaFee: number | null
  insuranceFee: number | null
  rejectionInsurance: number | null
  applicants: Array<{
    name: string
    phone: string | null
    visaResultAt: Date | null
  }>
  sheetName: string
}

/**
 * 解析单个工作表
 */
function parseSheet(workbook: XLSX.WorkBook, sheetName: string): ParsedOrder[] {
  const worksheet = workbook.Sheets[sheetName]
  if (!worksheet) return []

  // 获取数据范围
  const range = XLSX.utils.decode_range(worksheet['!ref'] ?? 'A1')
  const totalRows = range.e.r - range.s.r + 1

  // 表头在第 2 行（index=1），数据从第 3 行（index=2）开始
  const headerRowIndex = 1
  if (totalRows < 3) return []

  // 读取表头
  const headers: string[] = []
  for (let c = range.s.c; c <= range.e.c; c++) {
    headers.push(String(getCell(worksheet, headerRowIndex, c) ?? ''))
  }

  // 模糊匹配列
  const columnMap = matchColumns(headers)
  if (columnMap.size < 5) {
    console.log(`  ⚠️  表 "${sheetName}" 匹配到 ${columnMap.size} 列，跳过（格式可能不标准）`)
    return []
  }

  // 检测合并单元格
  const mergedRanges = detectMergedRanges(worksheet, headerRowIndex, totalRows - 2)

  // 获取列索引
  const colIndex = (field: string): number | undefined => {
    for (const [col, f] of columnMap) {
      if (f === field) return col
    }
    return undefined
  }

  // 解析每一行
  const orders: ParsedOrder[] = []
  let currentOrder: ParsedOrder | null = null

  for (let r = headerRowIndex + 1; r <= range.e.r; r++) {
    // 获取 B 列值（联系人）
    const contactCell = getCell(worksheet, r, colIndex('contactName') ?? 1)
    const applicantCell = getCell(worksheet, r, colIndex('applicantName') ?? 2)

    // 跳过空行
    if (!applicantCell && !contactCell) continue

    // 跳过汇总行
    const rowText = headers.map((_, c) => String(getCell(worksheet, r, c) ?? '')).join('')
    if (rowText.includes('合计') || rowText.includes('总计') || rowText.includes('汇总')) continue

    // 检查是否是新订单的起始行（B 列有值）
    const rangeInfo = mergedRanges.get(r)
    const isNewOrder = rangeInfo ? rangeInfo.startRow === r : !!contactCell

    if (isNewOrder) {
      // 新订单开始
      if (currentOrder) {
        orders.push(currentOrder)
      }

      const extOrderNo = colIndex('externalOrderNo') !== undefined
        ? String(getCell(worksheet, r, colIndex('externalOrderNo')!) ?? '').split('\n')[0].trim() || null
        : null

      const amountVal = colIndex('amount') !== undefined
        ? Number(getCell(worksheet, r, colIndex('amount')!)) || 0
        : 0

      const createdDate = colIndex('createdAt') !== undefined
        ? excelDateToJS(Number(getCell(worksheet, r, colIndex('createdAt')!)))
        : null

      const submittedDate = colIndex('submittedAt') !== undefined
        ? excelDateToJS(Number(getCell(worksheet, r, colIndex('submittedAt')!)))
        : null

      currentOrder = {
        contactName: String(contactCell ?? applicantCell ?? '').trim(),
        customerPhone: colIndex('phone') !== undefined
          ? String(getCell(worksheet, r, colIndex('phone')!) ?? '').trim()
          : '',
        targetCountry: colIndex('country') !== undefined
          ? String(getCell(worksheet, r, colIndex('country')!) ?? '').trim()
          : '',
        targetCity: colIndex('city') !== undefined
          ? String(getCell(worksheet, r, colIndex('city')!) ?? '').trim() || null
          : null,
        visaCategory: colIndex('category') !== undefined
          ? String(getCell(worksheet, r, colIndex('category')!) ?? '').trim() || null
          : null,
        remark: colIndex('remark') !== undefined
          ? String(getCell(worksheet, r, colIndex('remark')!) ?? '').trim() || null
          : null,
        createdAt: createdDate,
        createdBy: colIndex('createdBy') !== undefined
          ? String(getCell(worksheet, r, colIndex('createdBy')!) ?? '').trim() || null
          : null,
        collectorName: colIndex('collector') !== undefined
          ? String(getCell(worksheet, r, colIndex('collector')!) ?? '').trim() || null
          : null,
        submittedAt: submittedDate,
        operatorName: colIndex('operator') !== undefined
          ? String(getCell(worksheet, r, colIndex('operator')!) ?? '').trim() || null
          : null,
        externalOrderNo: extOrderNo,
        amount: amountVal,
        paymentMethod: colIndex('paymentMethod') !== undefined
          ? standardizePayment(getCell(worksheet, r, colIndex('paymentMethod')!))
          : null,
        platformFeeRate: colIndex('platformFeeRate') !== undefined
          ? parseFeeRate(getCell(worksheet, r, colIndex('platformFeeRate')!))
          : null,
        platformFee: colIndex('platformFee') !== undefined
          ? Number(getCell(worksheet, r, colIndex('platformFee')!)) || null
          : null,
        visaFee: colIndex('visaFee') !== undefined
          ? Number(getCell(worksheet, r, colIndex('visaFee')!)) || null
          : null,
        insuranceFee: colIndex('insuranceFee') !== undefined
          ? Number(getCell(worksheet, r, colIndex('insuranceFee')!)) || null
          : null,
        rejectionInsurance: colIndex('rejectionInsurance') !== undefined
          ? Number(getCell(worksheet, r, colIndex('rejectionInsurance')!)) || null
          : null,
        applicants: [],
        sheetName,
      }
    }

    // 添加申请人（每一行都是一个申请人）
    if (currentOrder) {
      const visaResultDate = colIndex('visaResultAt') !== undefined
        ? excelDateToJS(Number(getCell(worksheet, r, colIndex('visaResultAt')!)))
        : null

      currentOrder.applicants.push({
        name: String(applicantCell ?? '').trim(),
        phone: colIndex('phone') !== undefined
          ? String(getCell(worksheet, r, colIndex('phone')!) ?? '').trim() || null
          : null,
        visaResultAt: visaResultDate,
      })
    }
  }

  // 推送最后一个订单
  if (currentOrder) {
    orders.push(currentOrder)
  }

  return orders
}

// ==================== 写入数据库 ====================

async function importOrders(orders: ParsedOrder[], companyId: string): Promise<{
  orderCount: number
  applicantCount: number
  errors: string[]
}> {
  let orderCount = 0
  let applicantCount = 0
  const errors: string[] = []

  for (const order of orders) {
    try {
      // 跳过无申请人数据
      if (order.applicants.length === 0 || !order.applicants[0].name) {
        errors.push(`跳过：联系人="${order.contactName}" 无申请人数据`)
        continue
      }

      // 跳过无国家
      if (!order.targetCountry) {
        errors.push(`跳过：联系人="${order.contactName}" 无目标国家`)
        continue
      }

      // 生成系统订单号
      const orderNo = generateOrderNo()

      // 映射用户 ID
      const createdBy = order.createdBy ? (NAME_MAP[order.createdBy] ?? null) : null
      const collectorId = order.collectorName ? (NAME_MAP[order.collectorName] ?? null) : null
      const operatorId = order.operatorName ? (NAME_MAP[order.operatorName] ?? null) : null

      // 财务计算
      const feeRate = order.platformFeeRate ?? 0.061
      const platformFee = order.platformFee ?? Math.round(order.amount * feeRate * 100) / 100
      const grossProfit = Math.round(
        (order.amount - platformFee - (order.visaFee ?? 0) - (order.insuranceFee ?? 0)
          - (order.rejectionInsurance ?? 0)) * 100
      ) / 100

      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 创建订单
        const dbOrder = await tx.order.create({
          data: {
            companyId,
            orderNo,
            externalOrderNo: order.externalOrderNo,
            customerName: order.contactName,
            customerPhone: order.customerPhone || '00000000000',
            targetCountry: order.targetCountry,
            visaType: '旅游',
            visaCategory: order.visaCategory,
            remark: order.remark,
            amount: order.amount,
            paymentMethod: order.paymentMethod,
            status: 'DELIVERED', // 历史数据默认已交付
            createdBy: createdBy ?? '',
            collectorId,
            operatorId,
            contactName: order.contactName,
            targetCity: order.targetCity,
            submittedAt: order.submittedAt,
            applicantCount: order.applicants.length,
            platformFeeRate: feeRate,
            platformFee,
            visaFee: order.visaFee,
            insuranceFee: order.insuranceFee,
            rejectionInsurance: order.rejectionInsurance,
            grossProfit,
            createdAt: order.createdAt ?? new Date(),
            deliveredAt: order.createdAt ?? new Date(),
          },
        })

        // 创建申请人
        for (let i = 0; i < order.applicants.length; i++) {
          const a = order.applicants[i]
          if (!a.name) continue
          await tx.applicant.create({
            data: {
              orderId: dbOrder.id,
              companyId,
              name: a.name,
              phone: a.phone,
              sortOrder: i,
            },
          })
          applicantCount++
        }

        // 操作日志
        await tx.orderLog.create({
          data: {
            orderId: dbOrder.id,
            companyId,
            userId: createdBy ?? '',
            action: '历史数据导入',
            detail: `从 Excel "${order.sheetName}" 导入，${order.applicants.length} 位申请人`,
          },
        })
      })

      orderCount++
    } catch (err) {
      errors.push(`导入失败：联系人="${order.contactName}" — ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { orderCount, applicantCount, errors }
}

function generateOrderNo(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase()
  return `HX${y}${m}${d}${rand}`
}

// ==================== 主入口 ====================

async function main() {
  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dry-run')
  const sheetFilter = args.find(a => a.startsWith('--sheet'))?.split('=')[1]
    ?? (args.includes('--sheet') ? args[args.indexOf('--sheet') + 1] : undefined)
  const filePath = args.find(a => !a.startsWith('--') && a !== sheetFilter)

  if (!filePath) {
    console.error('❌ 用法: npx tsx scripts/import-excel.ts <excel文件> [--dry-run] [--sheet "表名"]')
    process.exit(1)
  }

  const fullPath = path.resolve(filePath)
  console.log(`📖 读取文件: ${fullPath}`)

  // 读取 Excel
  const workbook = XLSX.readFile(fullPath, { cellDates: false, cellNF: false })
  const sheetNames = workbook.SheetNames.filter(name => !SKIP_SHEETS.includes(name))

  console.log(`📊 工作表: ${sheetNames.length} 个（跳过 ${workbook.SheetNames.length - sheetNames.length} 个异常表）`)

  // 解析所有表
  const allOrders: ParsedOrder[] = []
  const filteredSheets = sheetFilter ? sheetNames.filter(n => n.includes(sheetFilter)) : sheetNames

  for (const sheetName of filteredSheets) {
    const orders = parseSheet(workbook, sheetName)
    console.log(`  ✅ "${sheetName}": ${orders.length} 单 / ${orders.reduce((s, o) => s + o.applicants.length, 0)} 人`)
    allOrders.push(...orders)
  }

  console.log(`\n📋 汇总: ${allOrders.length} 单 / ${allOrders.reduce((s, o) => s + o.applicants.length, 0)} 位申请人`)

  // 统计信息
  const multiOrders = allOrders.filter(o => o.applicants.length > 1)
  console.log(`   多人订单: ${multiOrders.length} 单 (${(multiOrders.length / allOrders.length * 100).toFixed(1)}%)`)

  const countries: Record<string, number> = {}
  allOrders.forEach(o => { countries[o.targetCountry] = (countries[o.targetCountry] ?? 0) + 1 })
  const topCountries = Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 8)
  console.log(`   国家分布: ${topCountries.map(([c, n]) => `${c}(${n})`).join(', ')}`)

  // Dry-run：预览前 5 个订单
  if (isDryRun) {
    console.log('\n🔍 DRY-RUN 模式 — 预览前 5 个订单:\n')
    const preview = allOrders.slice(0, 5)
    for (let i = 0; i < preview.length; i++) {
      const o = preview[i]
      console.log(`--- 订单 ${i + 1} ---`)
      console.log(`  联系人: ${o.contactName}`)
      console.log(`  申请人: ${o.applicants.map(a => a.name).join(', ')}`)
      console.log(`  手机号: ${o.customerPhone || '-'}`)
      console.log(`  国家: ${o.targetCountry}`)
      console.log(`  套餐: ${o.visaCategory || '-'}`)
      console.log(`  金额: ${formatAmount(o.amount)}`)
      console.log(`  支付: ${o.paymentMethod || '-'}`)
      console.log(`  扣点: ${o.platformFeeRate !== null ? (o.platformFeeRate * 100).toFixed(1) + '%' : '-'}`)
      console.log(`  下单: ${formatDate(o.createdAt)}`)
      console.log(`  递交: ${formatDate(o.submittedAt)}`)
      console.log(`  外部单号: ${o.externalOrderNo || '-'}`)
      console.log(`  来源表: "${o.sheetName}"`)
      console.log('')
    }

    console.log('✅ DRY-RUN 完成。确认无误后去掉 --dry-run 参数重新运行即可导入。')
    await prisma.$disconnect()
    return
  }

  // 正式导入
  console.log('\n🚀 开始写入数据库...')

  // 获取公司 ID（使用第一个非 system 的公司，或创建一个默认公司）
  let company = await prisma.company.findFirst({
    where: { id: { not: 'system' }, status: 'ACTIVE' },
  })

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: '沐海旅行',
        status: 'ACTIVE',
      },
    })
    console.log(`  📌 创建默认公司: ${company.name} (${company.id})`)
  }

  // 动态加载用户映射
  const users = await prisma.user.findMany({
    where: { companyId: company.id, status: 'ACTIVE' },
    select: { id: true, realName: true, username: true },
  })

  // 自动建立姓名映射
  for (const user of users) {
    NAME_MAP[user.realName] = user.id
    // 昵称映射（姓氏）
    const surname = user.realName.charAt(0)
    if (!NAME_MAP[surname]) NAME_MAP[surname] = user.id
  }

  console.log(`  📌 用户映射: ${Object.keys(NAME_MAP).length} 个名称 → ${users.length} 个用户`)

  const result = await importOrders(allOrders, company.id)

  console.log(`\n✅ 导入完成:`)
  console.log(`   订单: ${result.orderCount} 单`)
  console.log(`   申请人: ${result.applicantCount} 人`)

  if (result.errors.length > 0) {
    console.log(`\n⚠️  跳过/错误: ${result.errors.length} 条`)
    result.errors.slice(0, 10).forEach(e => console.log(`   - ${e}`))
    if (result.errors.length > 10) {
      console.log(`   ... 还有 ${result.errors.length - 10} 条`)
    }
  }

  // 验证
  const dbOrderCount = await prisma.order.count({ where: { companyId: company.id } })
  const dbApplicantCount = await prisma.applicant.count({ where: { companyId: company.id } })
  console.log(`\n📊 数据库验证:`)
  console.log(`   erp_orders: ${dbOrderCount}`)
  console.log(`   erp_applicants: ${dbApplicantCount}`)

  await prisma.$disconnect()
}

main().catch(err => {
  console.error('❌ 导入失败:', err)
  process.exit(1)
})
