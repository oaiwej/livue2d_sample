/**
 * WAVファイルのフォーマット情報を表すインターフェース
 */
export interface WavFormat {
  channels: number
  sampleRate: number
  bitsPerSample: number
}
