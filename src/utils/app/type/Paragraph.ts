import { v4 as uuid } from 'uuid'
import type { VoiceVoxAudioQuery } from '../../voicevox/type/VoiceVoxAudioQuery'
import type { ExpressionType } from './ExpressionType'

export interface Paragraph {
  id: string
  start: number // 開始時間（ミリ秒）
  end: number // 終了時間（ミリ秒）
  text: string
  speaker: number
  speedScale: number
  expressionType: ExpressionType
  audioQueries: VoiceVoxAudioQuery[] | null
}

export const DEFAULT_PARAGRAPH: Paragraph = {
  id: uuid(),
  start: 0,
  end: 0,
  expressionType: 'auto',
  text: '',
  speaker: 3,
  speedScale: 1.2,
  audioQueries: null,
} as const
