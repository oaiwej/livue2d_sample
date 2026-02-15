import axios, { type AxiosRequestConfig } from 'axios'
import type { VoiceVoxSpeakersResponse } from './type/VoiceVoxSpeakers'

export async function requestSpeakers(
  config: AxiosRequestConfig = {},
): Promise<VoiceVoxSpeakersResponse> {
  const apiUrl = import.meta.env.VITE_VOICEVOX_API_BASE_URL.replace(/\/$/, '')
  const response = await axios.get(`${apiUrl}/speakers`, config)
  return response.data
}
