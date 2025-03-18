import type { VoiceVoxMora } from '../voicevox/type/VoiceVoxMora'

/**
 * 現在の経過時間に対応する音素と直前の音素を特定する
 *
 * @param moras 音素データの配列
 * @param elapsedTime 経過時間（秒）
 * @returns 現在と直前の音素情報およびそれらの時間位置
 */
export function getCurrentAndPreviousMora(
  moras: VoiceVoxMora[],
  elapsedTime: number,
  speedScale: number = 1.0,
) {
  let currentMora: VoiceVoxMora | null = null
  let currentMoraTime = 0
  let previousMora: VoiceVoxMora | null = null
  let previousMoraTime = 0
  let totalTime = 0

  // すべての音素を走査し、現在の経過時間に対応する音素と直前の音素を特定
  for (const mora of moras) {
    // 子音と母音の長さを合計して音素の総時間を計算
    // totalTime += mora.vowel_length + (mora.consonant_length ?? 0)
    totalTime += (mora.vowel_length + (mora.consonant_length ?? 0)) * (1.0 / speedScale)

    // 撥音「ん」と無音の場合は無視
    if (mora.vowel === 'N' || mora.vowel === 'cl') {
      continue
    }

    // 経過時間より前の最新の音素を前の音素として記録
    if (totalTime < elapsedTime) {
      previousMora = mora
      previousMoraTime = totalTime
    }

    // 経過時間を超えた最初の音素を現在の音素として記録し探索終了
    if (totalTime > elapsedTime) {
      currentMora = mora
      currentMoraTime = totalTime
      break
    }
  }

  return { currentMora, currentMoraTime, previousMora, previousMoraTime }
}
