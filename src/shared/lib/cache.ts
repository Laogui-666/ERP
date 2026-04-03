import { LRUCache } from 'lru-cache'

// 缓存配置
const CACHE_CONFIG = {
  max: 1000, // 最大缓存项数
  ttl: 1000 * 60 * 5, // 缓存过期时间（5分钟）
  allowStale: false, // 不允许使用过期缓存
}

// 创建不同类型的缓存
const caches = {
  // 用户信息缓存
  users: new LRUCache<string, any>(CACHE_CONFIG),
  // 订单缓存
  orders: new LRUCache<string, any>(CACHE_CONFIG),
  // 公司信息缓存
  companies: new LRUCache<string, any>(CACHE_CONFIG),
  // 部门信息缓存
  departments: new LRUCache<string, any>(CACHE_CONFIG),
  // 签证模板缓存
  templates: new LRUCache<string, any>(CACHE_CONFIG),
  // 系统配置缓存
  configs: new LRUCache<string, any>(CACHE_CONFIG),
}

/**
 * 缓存工具类
 */
export class Cache {
  /**
   * 设置缓存
   */
  static set<T>(type: keyof typeof caches, key: string, value: T): void {
    caches[type].set(key, value)
  }

  /**
   * 获取缓存
   */
  static get<T>(type: keyof typeof caches, key: string): T | undefined {
    return caches[type].get(key)
  }

  /**
   * 删除缓存
   */
  static delete(type: keyof typeof caches, key: string): void {
    caches[type].delete(key)
  }

  /**
   * 清除指定类型的所有缓存
   */
  static clear(type: keyof typeof caches): void {
    caches[type].clear()
  }

  /**
   * 清除所有缓存
   */
  static clearAll(): void {
    Object.values(caches).forEach(cache => cache.clear())
  }

  /**
   * 获取缓存大小
   */
  static size(type: keyof typeof caches): number {
    return caches[type].size
  }
}

// 导出缓存实例
export const cache = Cache