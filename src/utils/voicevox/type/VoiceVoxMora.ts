import type { VoiceVoxVowel } from './VoiceVoxVowel'

export interface VoiceVoxMora {
  text: string
  consonant: string | null
  consonant_length: number | null
  vowel: VoiceVoxVowel
  vowel_length: number
  pitch: number
}
