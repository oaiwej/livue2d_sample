import type { VoiceVoxVowel } from '../voicevox/type/VoiceVoxVowel'

export interface MouthParameters {
  ParamA: number
  ParamI: number
  ParamU: number
  ParamE: number
  ParamO: number
  ParamMouthOpenY: number
  ParamMouthForm: number
}

export function vowelToMouthParameters(vowel: VoiceVoxVowel): MouthParameters {
  const ParamA = vowel === 'a' || vowel === 'A' ? 1 : 0
  const ParamI = vowel === 'i' || vowel === 'I' ? 1 : 0
  const ParamU = vowel === 'u' || vowel === 'U' ? 1 : 0
  const ParamE = vowel === 'e' || vowel === 'E' ? 1 : 0
  const ParamO = vowel === 'o' || vowel === 'O' ? 1 : 0

  let ParamMouthOpenY = 0
  let ParamMouthForm = 0
  switch (vowel) {
    case 'a':
    case 'A':
      ParamMouthOpenY = 1.0
      ParamMouthForm = 1.0
      break
    case 'i':
    case 'I':
      ParamMouthOpenY = 0.5
      ParamMouthForm = 1.0
      break
    case 'u':
    case 'U':
      ParamMouthOpenY = 0.5
      ParamMouthForm = 0.5
      break
    case 'e':
    case 'E':
      ParamMouthOpenY = 0.6
      ParamMouthForm = 0.8
      break
    case 'o':
    case 'O':
      ParamMouthOpenY = 0.7
      ParamMouthForm = 0.5
      break
    case 'N':
    case 'pau':
    case 'cl':
    default:
      ParamMouthOpenY = 0.0
      ParamMouthForm = 0.5
      break
  }

  return {
    ParamA,
    ParamI,
    ParamU,
    ParamE,
    ParamO,
    ParamMouthOpenY,
    ParamMouthForm,
  }
}
