import axios from 'axios'
import type { VoiceVoxAudioQuery } from './type/VoiceVoxAudioQuery'

/**
 * テキストを送信して音声合成をリクエストする
 * @param audio_query
 * @param speaker
 * @returns 音声データ
 */
export async function requestSynthesis(
  audio_query: VoiceVoxAudioQuery,
  speaker: number,
): Promise<ArrayBuffer> {
  const apiUrl = import.meta.env.VITE_VOICEVOX_API_BASE_URL.replace(/\/$/, '')
  const response = await axios.post(`${apiUrl}/synthesis`, audio_query, {
    params: {
      speaker,
    },
    responseType: 'arraybuffer',
  })
  return response.data
}

/**
 * テキストの配列を送信して音声合成をリクエストする
 * @param audio_queries
 * @param speaker
 * @returns 音声データの配列
 */
export async function requestMultiSynthesis(
  audio_queries: VoiceVoxAudioQuery[],
  speaker: number,
): Promise<ArrayBuffer[]> {
  const buffers = []
  for (const audio_query of audio_queries) {
    const buffer = await requestSynthesis(audio_query, speaker)
    buffers.push(buffer)
  }
  return buffers
}
