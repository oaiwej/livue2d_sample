import type { VoiceVoxAudioQuery } from '@/livue2d/utils/voicevox/type/VoiceVoxAudioQuery'
import { createMorasWithPauses } from './createMorasWithPauses'

/**
 * 音声の再生時間を計算
 * @param queryData
 * @returns 再生時間（秒）
 */
export function getDurationFromAudioQuery(queryData: VoiceVoxAudioQuery): number {
  const moras = createMorasWithPauses(queryData)
  const duration = moras.reduce(
    (acc, mora) => acc + mora.vowel_length + (mora.consonant_length ?? 0),
    0,
  )
  return duration
}

/**
 * 複数の音声の再生時間を計算
 * @param audioQueries
 * @returns 再生時間（秒）
 */
export function getDurationFromAudioQueries(audioQueries: VoiceVoxAudioQuery[]): number {
  return audioQueries.reduce((acc, query) => acc + getDurationFromAudioQuery(query), 0)
}
