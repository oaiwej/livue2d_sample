import type { csmMap } from '@framework/type/csmmap'

export function csmMapToObject<K extends string | number | symbol, T>(
  map: csmMap<K, T>,
): Record<K, T> {
  const obj = {} as Record<K, T>
  map._keyValues.forEach((e) => {
    obj[e.first] = e.second
  })
  return obj
}
