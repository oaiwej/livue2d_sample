import { logger } from '@/logger'
import { inject } from 'vue'

/**
 * Vue3のinject関数のラッパーで、nullチェックを行い、
 * 値が存在しない場合はエラーを投げます。
 *
 * @template T - 取得したい注入値の型
 * @param key - 注入値のキー
 * @returns 注入された値（nullまたはundefinedではない）
 * @throws {Error} 注入値が見つからない、またはnull/undefinedの場合
 */
export function safeInject<T>(key: string | symbol): T {
  const value = inject<T | null | undefined>(key)

  if (value === null || value === undefined) {
    const errorMessage = `Failed to inject: ${String(key)} is not provided`
    logger.error(errorMessage)
    throw new Error(errorMessage)
  }

  return value
}
