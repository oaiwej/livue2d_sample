/**
 * Spherical linear interpolation
 * @param a Start value
 * @param b End value
 * @param t Interpolation value
 * @returns Interpolated value
 */
export function slerp(a: number, b: number, t: number): number {
  return a + (b - a) * t * t * (3 - 2 * t)
}
