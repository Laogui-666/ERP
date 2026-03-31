import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/shared/lib/**/*.ts', 'src/modules/erp/lib/**/*.ts'],
      exclude: ['src/shared/lib/prisma.ts', 'src/shared/lib/socket.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@erp': path.resolve(__dirname, './src/modules/erp'),
    },
  },
})
