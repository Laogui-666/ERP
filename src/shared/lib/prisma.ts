import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 优化：添加连接池配置，提高数据库性能
const prismaClientOptions: Prisma.PrismaClientOptions = {
  log: process.env.NODE_ENV === 'development' 
    ? ['warn', 'error'] as const 
    : ['error'] as const,
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'mysql://localhost:3306/visa',
    },
  },
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaClientOptions)

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// 定期清理空闲连接，保持连接池健康
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    prisma.$queryRaw`SELECT 1`
      .catch(console.error)
  }, 5 * 60 * 1000) // 每5分钟执行一次
}