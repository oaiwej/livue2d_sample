import axios from 'axios'
import type { VoiceVoxSpeakersResponse } from './type/VoiceVoxSpeakers'

export async function requestSpeakers(): Promise<VoiceVoxSpeakersResponse> {
  const apiUrl = import.meta.env.VITE_VOICEVOX_API_BASE_URL.replace(/\/$/, '')
  const response = await axios.get(`${apiUrl}/speakers`)
  return response.data
}
