#!/usr/bin/env node
/**
 * 配置阿里云 OSS Bucket 的 CORS 规则
 * 使用方式：在服务器项目目录下运行
 *   node scripts/configure-oss-cors.js
 */

const OSS = require('ali-oss')
require('dotenv').config({ path: '.env.local' })

const client = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET,
})

async function main() {
  console.log(`\n🔧 配置 OSS Bucket [${process.env.OSS_BUCKET}] CORS...\n`)

  // 先查询现有规则
  try {
    const existing = await client.getBucketCORS()
    console.log('📋 现有 CORS 规则:')
    const rules = existing.rules?.CORSRule || existing.rules || []
    if (Array.isArray(rules) && rules.length > 0) {
      rules.forEach((r, i) => console.log(`  ${i + 1}. AllowedOrigins: ${r.AllowedOrigin}, Methods: ${r.AllowedMethod}`))
    } else {
      console.log('  (无)')
    }
  } catch {
    console.log('  (无现有规则)')
  }

  // 设置新规则
  const corsRules = {
    CORSRule: [
      {
        AllowedOrigin: ['*'],
        AllowedMethod: ['PUT', 'GET', 'POST', 'DELETE', 'HEAD'],
        AllowedHeader: ['*'],
        ExposeHeader: ['ETag', 'content-length', 'content-type'],
        MaxAgeSeconds: 3600,
      },
    ],
  }

  try {
    await client.putBucketCORS(corsRules)
    console.log('\n✅ CORS 规则配置成功!')
    console.log('   AllowedOrigins: *')
    console.log('   AllowedMethods: PUT, GET, POST, DELETE, HEAD')
    console.log('   AllowedHeaders: *')
    console.log('   MaxAge: 3600s')
    console.log('\n⚠️  注意: AllowedOrigin 为 * (允许所有来源)')
    console.log('   生产环境建议改为具体域名，如: http://223.6.248.154:3002\n')
  } catch (err) {
    console.error('\n❌ 配置失败:', err.message)
    process.exit(1)
  }
}

main()
