import OSS from 'ali-oss'
import type { Readable } from 'stream'

// ==================== 客户端单例 ====================

let ossClient: OSS | null = null

export function getOssClient(): OSS {
  if (!ossClient) {
    const region = process.env.OSS_REGION
    const accessKeyId = process.env.OSS_ACCESS_KEY_ID
    const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET
    const bucket = process.env.OSS_BUCKET

    if (!region || !accessKeyId || !accessKeySecret || !bucket) {
      throw new Error('OSS 配置缺失：请检查 .env.local 中的 OSS_* 环境变量')
    }

    ossClient = new OSS({
      region,
      accessKeyId,
      accessKeySecret,
      bucket,
      // 超时设置
      timeout: 60_000,
    })
  }
  return ossClient
}

// ==================== 类型定义 ====================

export interface UploadResult {
  url: string
  key: string
  size: number
}

export interface SignedUrlResult {
  url: string
  expires: number
}

// ==================== OSS 路径构建 ====================

/**
 * 构建 OSS 存储路径
 * 结构: companies/{companyId}/orders/{orderId}/documents|materials|chat/...
 *
 * chat 类型不使用 subId，路径为:
 *   companies/{companyId}/orders/{orderId}/chat/{timestamp}_{filename}
 */
export function buildOssKey(params: {
  companyId: string
  orderId: string
  type: 'documents' | 'materials' | 'chat'
  subId?: string
  fileName: string
}): string {
  const { companyId, orderId, type, subId, fileName } = params
  const timestamp = Date.now()
  const safeName = fileName.replace(/[^a-zA-Z0-9._\-\u4e00-\u9fff]/g, '_')

  if (subId) {
    return `companies/${companyId}/orders/${orderId}/${type}/${subId}/${timestamp}_${safeName}`
  }
  return `companies/${companyId}/orders/${orderId}/${type}/${timestamp}_${safeName}`
}

// ==================== 上传 ====================

/**
 * 上传文件到 OSS
 * 支持 Buffer、Uint8Array、Readable Stream
 */
export async function uploadFile(
  file: Buffer | Uint8Array | Readable,
  ossKey: string,
  mimeType: string,
): Promise<UploadResult> {
  const client = getOssClient()

  const result = await client.put(ossKey, file, {
    headers: {
      'Content-Type': mimeType,
      // 上传后文件可读（私有 bucket 用签名 URL）
      'x-oss-object-acl': 'private',
    },
  })

  // 生成签名 URL（默认 7 天）
  const signedUrl = client.signatureUrl(ossKey, { expires: 7 * 24 * 3600 })

  const size = (() => {
    const headers = result.res?.headers as Record<string, string> | undefined
    return headers?.['content-length'] ? parseInt(headers['content-length'], 10) : 0
  })()

  return {
    url: signedUrl,
    key: result.name,
    size,
  }
}

/**
 * 生成预签名上传 URL（客户端直传用）
 * 前端拿到 URL 后直接 PUT 上传，文件不经过服务器
 */
export async function generatePresignedPutUrl(
  ossKey: string,
  mimeType: string,
  expires: number = 3600,
): Promise<{ url: string; key: string }> {
  const client = getOssClient()

  const url = client.signatureUrl(ossKey, {
    method: 'PUT',
    expires,
    'Content-Type': mimeType,
  })

  return { url, key: ossKey }
}

// ==================== 下载 / 签名 URL ====================

/**
 * 生成签名下载 URL（带过期时间）
 */
export function getSignedUrl(ossKey: string, expires: number = 3600, contentType?: string): SignedUrlResult {
  const client = getOssClient()

  const url = client.signatureUrl(ossKey, {
    expires,
    response: {
      // 浏览器内联展示（而非下载）
      'content-disposition': 'inline',
      ...(contentType ? { 'content-type': contentType } : {}),
    },
  })

  return { url, expires }
}

/**
 * 生成强制下载的签名 URL
 */
export function getDownloadUrl(ossKey: string, fileName: string, expires: number = 3600): string {
  const client = getOssClient()

  return client.signatureUrl(ossKey, {
    expires,
    response: {
      'content-disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
    },
  })
}

// ==================== 删除 ====================

/**
 * 删除 OSS 文件
 */
export async function deleteFile(ossKey: string): Promise<void> {
  const client = getOssClient()
  await client.delete(ossKey)
}

/**
 * 批量删除 OSS 文件
 */
export async function deleteFiles(ossKeys: string[]): Promise<void> {
  if (ossKeys.length === 0) return

  const client = getOssClient()
  await client.deleteMulti(ossKeys)
}

// ==================== 文件信息 ====================

/**
 * 检查文件是否存在
 */
export async function fileExists(ossKey: string): Promise<boolean> {
  try {
    const client = getOssClient()
    await client.head(ossKey)
    return true
  } catch {
    return false
  }
}

/**
 * 获取文件元信息
 */
export async function getFileInfo(ossKey: string): Promise<{
  size: number
  mimeType: string
  lastModified: Date
} | null> {
  try {
    const client = getOssClient()
    const result = await client.head(ossKey)
    const headers = result.res?.headers as Record<string, string> | undefined
    return {
      size: parseInt(headers?.['content-length'] ?? '0', 10),
      mimeType: headers?.['content-type'] ?? 'application/octet-stream',
      lastModified: new Date(headers?.['last-modified'] ?? Date.now()),
    }
  } catch {
    return null
  }
}
