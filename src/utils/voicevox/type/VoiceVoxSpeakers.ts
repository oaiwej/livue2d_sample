export interface VoiceVoxSpeakerStyle {
  name: string
  id: number
  type: 'talk'
}

export interface ViceVoxSupportedFeatures {
  permitted_synthesis_morphing: 'ALL' | 'SELF_ONLY' | 'NOTHING'
}

export interface VoiceVoxSpeaker {
  name: string
  speaker_uuid: string
  styles: VoiceVoxSpeakerStyle[]
  version: string
  supported_features: ViceVoxSupportedFeatures
}

export type VoiceVoxSpeakersResponse = VoiceVoxSpeaker[]
