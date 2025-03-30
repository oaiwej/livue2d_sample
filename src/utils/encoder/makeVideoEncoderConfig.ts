/**
 * Live2Dの録画エンコーディングに関する型と設定を提供するモジュール
 */

/**
 * 各種コーデックのタグを表す型
 */
export type VideoCodecTag = 'avc1' | 'hvc1' | 'vp8' | 'vp09' | 'av01'

/**
 * 各種コーデックIDを表す型（WebMコンテナ用）
 */
export type VideoMatroskaId = 'V_MPEG4/ISO/AVC' | 'V_MPEGH/ISO/HEVC' | 'V_VP8' | 'V_VP9' | 'V_AV1'

/**
 * 各コーデックの文字列表現
 */
const codecStr = {
  avc: 'avc1.420034', // H.264コーデック
  hevc: 'hvc1.1.6.L123.00', // H.265コーデック
  vp8: 'vp8', // VP8コーデック
  vp9: 'vp09.00.10.08', // VP9コーデック
  av1: 'av01.0.04M.08', // AV1コーデック
} as const

/**
 * コーデック情報を表すインターフェース
 */
export interface VideoCodecInfo {
  codec: string // コーデックの文字列表現
  codecTag: VideoCodecTag // コーデックのタグ
  matroskaId: VideoMatroskaId // コーデックID
}

type VideoCodecOption = Pick<VideoEncoderConfig, 'codec' | 'hardwareAcceleration'>

/**
 * ビデオエンコーダの設定を作成する関数
 * 複数のコーデックを優先順位順に試し、サポートされている最初のものを使用する
 *
 * @param config - コーデックを除くビデオエンコーダの設定
 * @returns コーデック情報と設定をセットで返す、サポートされていない場合はnull
 */
export async function makeVideoEncoderConfig(config: Omit<VideoEncoderConfig, 'codec'>): Promise<{
  codecInfo: VideoCodecInfo | null
  config: VideoEncoderConfig | null
}> {
  // 試行するコーデックの優先順位リスト
  const codecs: VideoCodecOption[] = [
    { codec: codecStr.av1, hardwareAcceleration: 'prefer-hardware' }, // AV1（ハードウェア優先）
    { codec: codecStr.hevc, hardwareAcceleration: 'prefer-hardware' }, // HEVC（ハードウェア優先）
    { codec: codecStr.vp9, hardwareAcceleration: 'prefer-hardware' }, // VP9（ハードウェア優先）
    { codec: codecStr.hevc, hardwareAcceleration: 'prefer-software' }, // HEVC（ソフトウェア優先）
    { codec: codecStr.av1, hardwareAcceleration: 'prefer-software' }, // AV1（ソフトウェア優先）
    { codec: codecStr.vp9, hardwareAcceleration: 'prefer-software' }, // VP9（ソフトウェア優先）
    { codec: codecStr.avc, hardwareAcceleration: 'prefer-hardware' }, // AVC（ハードウェア優先）
    { codec: codecStr.avc, hardwareAcceleration: 'prefer-software' }, // AVC（ソフトウェア優先）
    { codec: codecStr.vp8, hardwareAcceleration: 'prefer-hardware' }, // VP8（ハードウェア優先）
    { codec: codecStr.vp8, hardwareAcceleration: 'prefer-software' }, // VP8（ソフトウェア優先）
  ]

  // サポートされている設定を探す
  const supportedConfig = await findSupportedConfig(config, codecs)
  if (!supportedConfig) {
    return { codecInfo: null, config: null }
  }

  // 見つかった設定に対応するコーデック情報をマッピング
  const codecInfo = mapCodecToInfo(supportedConfig.codec)
  if (!codecInfo) {
    return { codecInfo: null, config: null }
  }

  return { codecInfo, config: supportedConfig }
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
    // 各コーデックでサポート状況をチェック
    const videoEncodeSupport = await VideoEncoder.isConfigSupported({
      ...baseConfig,
      codec,
      hardwareAcceleration,
    })
    if (videoEncodeSupport.supported && videoEncodeSupport.config) {
      return videoEncodeSupport.config
    } else {
      console.log(`Not supported: ${codec} with ${hardwareAcceleration}`)
    }
  }
  return null
}

/**
 * コーデック文字列からコーデック情報にマッピングする関数
 *
 * @param codec - コーデックの文字列表現
 * @returns 対応するコーデック情報、または未対応の場合はnull
 */
function mapCodecToInfo(codec: string | undefined): VideoCodecInfo | null {
  switch (codec) {
    case codecStr.avc:
      return { codec, codecTag: 'avc1', matroskaId: 'V_MPEG4/ISO/AVC' }
    case codecStr.hevc:
      return { codec, codecTag: 'hvc1', matroskaId: 'V_MPEGH/ISO/HEVC' }
    case codecStr.vp8:
      return { codec, codecTag: 'vp8', matroskaId: 'V_VP8' }
    case codecStr.vp9:
      return { codec, codecTag: 'vp09', matroskaId: 'V_VP9' }
    case codecStr.av1:
      return { codec, codecTag: 'av01', matroskaId: 'V_AV1' }
    default:
      return null
  }
}
