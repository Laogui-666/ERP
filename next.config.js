/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hxvisa001.oss-cn-beijing.aliyuncs.com',
      },
      {
        protocol: 'https',
        hostname: '**.aliyuncs.com',
      },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7天缓存
    formats: ['image/avif', 'image/webp'], // 支持现代图片格式
  },
  serverExternalPackages: ['@prisma/client'],
  turbopack: {
    root: '/www/wwwroot/ERP',
  },
  // 性能优化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // 生产环境移除console
  },
  // 字体优化
  experimental: {
    optimizeCss: true, // 优化CSS
  },
  // 构建输出优化
  output: 'standalone', // 独立构建，减少依赖体积
  // 路由预加载
  generateBuildId: async () => {
    // 生成唯一的构建ID，用于缓存控制
    return process.env.BUILD_ID || `${Date.now()}`
  },
}

module.exports = nextConfig
