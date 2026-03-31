/**
 * 文件上传白名单
 * presign API、upload API、客户端组件统一引用此常量
 */
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'text/plain',
]

/** 最大文件大小：50MB */
export const MAX_FILE_SIZE = 50 * 1024 * 1024
