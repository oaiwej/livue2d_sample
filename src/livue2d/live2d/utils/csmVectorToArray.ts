import type { csmVector } from '@framework/type/csmvector'

export function csmVectorToArray<T>(vector: csmVector<T>): T[] {
  const array: T[] = []
  for (let i = 0; i < vector.getSize(); i++) {
    array.push(vector.at(i))
  }
  return array
}
