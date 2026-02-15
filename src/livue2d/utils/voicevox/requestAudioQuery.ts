import axios, { type AxiosRequestConfig } from 'axios'
import type { VoiceVoxAudioQuery } from './type/VoiceVoxAudioQuery'

/**
 * VOICEVOX API にテキストを送信してオーディオクエリを取得する
 * @param text
 * @param speaker
 * @returns
 */
export async function requestAudioQuery(
  text: string,
  speaker: number,
  config: AxiosRequestConfig = {},
): Promise<VoiceVoxAudioQuery> {
  const apiUrl = import.meta.env.VITE_VOICEVOX_API_BASE_URL.replace(/\/$/, '')
  const response = await axios.post(`${apiUrl}/audio_query`, null, {
    ...config,
    params: {
      text,
      speaker,
    },
  })
  return response.data
}

/**
 * テキストの配列を送信してオーディオクエリの配列を取得する
 * @param sentences
 * @param speaker
 * @returns
 */
export async function requestAudioQueries(
  sentences: string[],
  speaker: number,
  config: AxiosRequestConfig = {},
): Promise<VoiceVoxAudioQuery[]> {
  const audioQueries = []
  for (const sentence of sentences) {
    const audioQuery = await requestAudioQuery(sentence, speaker, config)
    audioQueries.push(audioQuery)
  }
  return audioQueries
}
