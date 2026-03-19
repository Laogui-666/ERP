// OSS (Object Storage Service) helper
// Placeholder implementation - replace with actual OSS provider (Aliyun OSS, AWS S3, etc.)

export interface UploadResult {
  url: string
  key: string
  size: number
}

export async function uploadFile(
  file: Buffer | Uint8Array,
  fileName: string,
  _mimeType: string,
): Promise<UploadResult> {
  // In production, implement actual OSS upload
  // For now, save to local public/uploads
  const key = `uploads/${Date.now()}-${fileName}`
  const url = `/api/files/${key}`

  // TODO: Implement actual OSS upload
  // const oss = new OSS({
  //   endpoint: process.env.OSS_ENDPOINT,
  //   accessKeyId: process.env.OSS_ACCESS_KEY,
  //   accessKeySecret: process.env.OSS_SECRET_KEY,
  //   bucket: process.env.OSS_BUCKET,
  // })
  // const result = await oss.put(key, file)
  // return { url: result.url, key: result.name, size: result.size }

  console.warn('OSS not configured, using placeholder. File:', fileName, 'Size:', file.length)

  return {
    url,
    key,
    size: file.length,
  }
}

export async function deleteFile(_key: string): Promise<void> {
  // TODO: Implement actual OSS delete
  // await oss.delete(key)
}

export function getSignedUrl(key: string, expires: number = 3600): string {
  // TODO: Implement signed URL generation
  return `/api/files/${key}?expires=${Date.now() + expires * 1000}`
}
