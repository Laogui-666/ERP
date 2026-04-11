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
  },
  serverExternalPackages: ['@prisma/client'],
  turbopack: {
    root: '/www/wwwroot/ERP',
  },
}

module.exports = nextConfig
