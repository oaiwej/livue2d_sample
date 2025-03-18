/**
 * キュービックイーズイン - ゆっくり始まり、急速に加速する
 * @param t 進行度 (0.0 から 1.0)
 * @returns イージング適用後の値 (0.0 から 1.0)
 */
export function easeInCubic(t: number): number {
  return t * t * t
}

/**
 * キュービックイーズアウト - 速く始まり、徐々に減速する
 * @param t 進行度 (0.0 から 1.0)
 * @returns イージング適用後の値 (0.0 から 1.0)
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * キュービックイーズインアウト - ゆっくり始まり、加速した後、最後に減速する
 * @param t 進行度 (0.0 から 1.0)
 * @returns イージング適用後の値 (0.0 から 1.0)
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * クァートイーズイン - キュービックより強い加速効果
 * @param t 進行度 (0.0 から 1.0)
 * @returns イージング適用後の値 (0.0 から 1.0)
 */
export function easeInQuart(t: number): number {
  return t * t * t * t
}

/**
 * クァートイーズアウト - 強い初速から滑らかに減速
 * @param t 進行度 (0.0 から 1.0)
 * @returns イージング適用後の値 (0.0 から 1.0)
 */
export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

/**
 * クァートイーズインアウト - 強めの加減速効果
 * @param t 進行度 (0.0 から 1.0)
 * @returns イージング適用後の値 (0.0 から 1.0)
 */
export function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
}

/**
 * クィントイーズイン - 非常に緩やかに始まり急激に加速
 * @param t 進行度 (0.0 から 1.0)
 * @returns イージング適用後の値 (0.0 から 1.0)
 */
export function easeInQuint(t: number): number {
  return t * t * t * t * t
}

/**
 * クィントイーズアウト - 高速で始まり非常に緩やかに減速
 * @param t 進行度 (0.0 から 1.0)
 * @returns イージング適用後の値 (0.0 から 1.0)
 */
export function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

/**
 * クィントイーズインアウト - 非常に強い加減速効果
 * @param t 進行度 (0.0 から 1.0)
 * @returns イージング適用後の値 (0.0 から 1.0)
 */
export function easeInOutQuint(t: number): number {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2
}

/**
 * サインイーズイン - 三角関数による滑らかな加速
 * @param t 進行度 (0.0 から 1.0)
 * @returns イージング適用後の値 (0.0 から 1.0)
 */
export function easeInSine(t: number): number {
  return 1 - Math.cos((t * Math.PI) / 2)
}

/**
 * サインイーズアウト - 三角関数による滑らかな減速
 * @param t 進行度 (0.0 から 1.0)
 * @returns イージング適用後の値 (0.0 から 1.0)
 */
export function easeOutSine(t: number): number {
  return Math.sin((t * Math.PI) / 2)
}
