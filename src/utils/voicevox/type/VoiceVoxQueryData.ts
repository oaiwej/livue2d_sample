import type { VoiceVoxAccentPhrase } from './VoiceVoxAccentPhrase'

export interface VoiceVoxQueryData {
  accent_phrases: VoiceVoxAccentPhrase[]
  speedScale: number
  pitchScale: number
  intonationScale: number
  volumeScale: number
  prePhonemeLength: number
  postPhonemeLength: number
  pauseLength: number | null
  pauseLengthScale: number
  outputSamplingRate: number
  outputStereo: boolean
  kana: string
}
