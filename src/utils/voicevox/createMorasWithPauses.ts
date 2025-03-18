import type { VoiceVoxQueryData } from '@/utils/voicevox/type/VoiceVoxQueryData'
import type { VoiceVoxMora } from './type/VoiceVoxMora'

/**
 * 音素データに無音区間を追加
 * 発話の前後に無音区間を挿入し、自然な口の動きを実現する
 *
 * @param queryData VOICEVOXのクエリデータ
 * @returns 無音を含む音素データの配列
 */
export function createMorasWithPauses(queryData: VoiceVoxQueryData): VoiceVoxMora[] {
  const moras: VoiceVoxMora[] = []

  // 発話前の無音区間を表す音素
  const prePhonemePauseMora: VoiceVoxMora = {
    text: '',
    consonant: null,
    consonant_length: null,
    vowel: 'pau',
    vowel_length: queryData.prePhonemeLength,
    pitch: 0.0,
  }

  // 発話後の無音区間を表す音素
  const postPhonemePauseMora: VoiceVoxMora = {
    text: '',
    consonant: null,
    consonant_length: null,
    vowel: 'pau',
    vowel_length: queryData.postPhonemeLength,
    pitch: 0.0,
  }

  // 発話前の無音を追加
  moras.push(prePhonemePauseMora)

  // アクセント句ごとの音素情報を追加
  for (const accent_phrase of queryData.accent_phrases) {
    // 各アクセント句の音素データを追加
    moras.push(...accent_phrase.moras)

    // 句読点などによる一時停止がある場合はそれも追加
    if (accent_phrase.pause_mora) {
      moras.push(accent_phrase.pause_mora)
    }
  }

  // 発話後の無音を追加
  moras.push(postPhonemePauseMora)

  return moras
}
