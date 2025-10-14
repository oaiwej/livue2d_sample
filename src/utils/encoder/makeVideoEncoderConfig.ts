/**
 * Live2Dの録画エンコーディングに関する型と設定を提供するモジュール
 */

/**
 * ビデオコーデック情報の定義
 */
export const VIDEO_CODECS = {
  avc1: {
    codec: 'avc1.420034',
    codecTag: 'avc1',
    matroskaId: 'V_MPEG4/ISO/AVC',
    defaultQP: 23,
  },
  hvc1: {
    codec: 'hvc1.1.6.L123.00',
    codecTag: 'hvc1',
    matroskaId: 'V_MPEGH/ISO/HEVC',
    defaultQP: 28,
  },
  vp8: {
    codec: 'vp8',
    codecTag: 'vp8',
    matroskaId: 'V_VP8',
    defaultQP: 10,
  },
  vp09: {
    codec: 'vp09.00.10.08',
    codecTag: 'vp09',
    matroskaId: 'V_VP9',
    defaultQP: 31,
  },
  av01: {
    codec: 'av01.0.04M.08',
    codecTag: 'av01',
    matroskaId: 'V_AV1',
    defaultQP: 35,
  },
} as const

// 型定義
type ValueOf<T> = T[keyof T]
export type VideoCodecInfo = ValueOf<typeof VIDEO_CODECS>
export type VideoCodecStr = VideoCodecInfo['codec']
export type VideoCodecTag = VideoCodecInfo['codecTag']
export type VideoMatroskaId = VideoCodecInfo['matroskaId']

/**
 * エンコーダで試行するコーデックオプション
 */
type VideoCodecOption = Pick<VideoEncoderConfig, 'codec' | 'hardwareAcceleration'>

/**
 * 優先順位付きのコーデック設定リスト
 */
const PRIORITIZED_CODECS: VideoCodecOption[] = [
  { codec: VIDEO_CODECS.av01.codec, hardwareAcceleration: 'prefer-hardware' },
  { codec: VIDEO_CODECS.hvc1.codec, hardwareAcceleration: 'prefer-hardware' },
  { codec: VIDEO_CODECS.vp09.codec, hardwareAcceleration: 'prefer-hardware' },
  { codec: VIDEO_CODECS.hvc1.codec, hardwareAcceleration: 'prefer-software' },
  { codec: VIDEO_CODECS.av01.codec, hardwareAcceleration: 'prefer-software' },
  { codec: VIDEO_CODECS.vp09.codec, hardwareAcceleration: 'prefer-software' },
  { codec: VIDEO_CODECS.avc1.codec, hardwareAcceleration: 'prefer-hardware' },
  { codec: VIDEO_CODECS.avc1.codec, hardwareAcceleration: 'prefer-software' },
  { codec: VIDEO_CODECS.vp8.codec, hardwareAcceleration: 'prefer-hardware' },
  { codec: VIDEO_CODECS.vp8.codec, hardwareAcceleration: 'prefer-software' },
]

/**
 * makeVideoEncoderConfigの戻り値の型
 */
interface VideoEncoderResult {
  codecInfo: VideoCodecInfo | null
  config: VideoEncoderConfig | null
}

/**
 * サポートされているコーデック設定を見つける関数
 *
 * @param baseConfig - 基本となるエンコーダ設定
 * @param codecs - 試行するコーデックのリスト
 * @returns サポートされている設定、または見つからない場合はnull
 */
async function findSupportedConfig(
  baseConfig: Omit<VideoEncoderConfig, 'codec'>,
  codecs: VideoCodecOption[],
): Promise<VideoEncoderConfig | null> {
  for (const { codec, hardwareAcceleration } of codecs) {
    try {
      const videoEncodeSupport = await VideoEncoder.isConfigSupported({
        ...baseConfig,
        codec,
        hardwareAcceleration,
      })

      if (videoEncodeSupport.supported && videoEncodeSupport.config) {
        return videoEncodeSupport.config
      }
    } catch (error) {
      console.error(`Error checking support for ${codec}:`, error)
    }

    console.log(`Not supported: ${codec} with ${hardwareAcceleration}`)
  }
  return null
}

/**
 * ビデオエンコーダの設定を作成する関数
 * 複数のコーデックを優先順位順に試し、サポートされている最初のものを使用する
 *
 * @param config - コーデックを除くビデオエンコーダの設定
 * @returns コーデック情報と設定をセットで返す、サポートされていない場合はnull
 */
export async function makeVideoEncoderConfig(
  config: Omit<VideoEncoderConfig, 'codec'>,
): Promise<VideoEncoderResult> {
  // サポートされている設定を探す
  const supportedConfig = await findSupportedConfig(config, PRIORITIZED_CODECS)

  if (!supportedConfig) {
    return { codecInfo: null, config: null }
  }

  // 見つかった設定に対応するコーデック情報をマッピング
  const codecInfo =
    Object.values(VIDEO_CODECS).find((info) => info.codec === supportedConfig.codec) || null

  return { codecInfo, config: supportedConfig }
}
