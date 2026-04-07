#!/usr/bin/env node
/**
 * 配置阿里云 OSS Bucket 的 CORS 规则
 * 用法: node scripts/configure-oss-cors.js
 */

const OSS = require('ali-oss')
require('dotenv').config({ path: '.env.local' })

const client = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET,
})

const BUCKET = process.env.OSS_BUCKET

async function main() {
  console.log(`\n🔧 配置 OSS Bucket [${BUCKET}] CORS...\n`)

  // 查询现有规则
  try {
    const existing = await client.getBucketCORS(BUCKET)
    const rules = existing.rules || []
    if (rules.length > 0) {
      console.log('📋 现有 CORS 规则:')
      rules.forEach((r, i) => console.log(`  ${i+1}. Origins: ${r.allowedOrigin}, Methods: ${r.allowedMethod}`))
    } else {
      console.log('📋 无现有规则')
    }
  } catch {
    console.log('📋 无现有规则')
  }

  // ali-oss 格式: putBucketCORS(bucketName, rules[])
  const rules = [
    {
      allowedOrigin: ['*'],
      allowedMethod: ['PUT', 'GET', 'POST', 'DELETE', 'HEAD'],
      allowedHeader: ['*'],
      exposeHeader: ['ETag', 'content-length', 'content-type'],
      maxAgeSeconds: 3600,
    },
  ]

  try {
    await client.putBucketCORS(BUCKET, rules)
    console.log('\n✅ CORS 配置成功!')
    console.log('   Origins: *')
    console.log('   Methods: PUT, GET, POST, DELETE, HEAD')
    console.log('   Headers: *')
    console.log('   MaxAge: 3600s')
  } catch (err) {
    console.error('\n❌ 配置失败:', err.message)
    process.exit(1)
  }
}

main()
