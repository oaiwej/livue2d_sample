import type { VoiceVoxMora } from './VoiceVoxMora'

export interface VoiceVoxAccentPhrase {
  moras: VoiceVoxMora[]
  accent: number
  pause_mora: VoiceVoxMora | null
  is_interrogative: boolean
}
