/**
 * Live2Dの録画エンコーディングに関する型と設定を提供するモジュール
 */

/**
 * 各種コーデックのタグを表す型
 */
export type AudioCodecTag = 'aac' | 'mp3' | 'flac' | 'opus' | 'vorbis'

/**
 * 各種コーデックIDを表す型（WebMコンテナ用）
 */
export type AudioMatroskaId = 'A_AAC' | 'A_MPEG/L3' | 'A_FLAC' | 'A_OPUS' | 'A_VORBIS'

/**
 * 各コーデックの情報を定義したマップ
 */
const CODEC_MAP: Record<AudioCodecTag, { str: string; id: AudioMatroskaId }> = {
  aac: { str: 'mp4a.40.2', id: 'A_AAC' },
  mp3: { str: 'mp3', id: 'A_MPEG/L3' },
  opus: { str: 'opus', id: 'A_OPUS' },
  flac: { str: 'flac', id: 'A_FLAC' },
  vorbis: { str: 'vorbis', id: 'A_VORBIS' },
}

/**
 * コーデック情報を表すインターフェース
 */
export interface AudioCodecInfo {
  codec: string // コーデックの文字列表現
  codecTag: AudioCodecTag // コーデックのタグ
  matroskaId: AudioMatroskaId // コーデックID
}

type AudioCodecOption = Pick<AudioEncoderConfig, 'codec'>

/**
 * ビデオエンコーダの設定を作成する関数
 * 複数のコーデックを優先順位順に試し、サポートされている最初のものを使用する
 *
 * @param config - コーデックを除くビデオエンコーダの設定
 * @returns コーデック情報と設定をセットで返す、サポートされていない場合はnull
 */
export async function makeAudioEncoderConfig(config: Omit<AudioEncoderConfig, 'codec'>): Promise<{
  codecInfo: AudioCodecInfo | null
  config: AudioEncoderConfig | null
}> {
  // 試行するコーデックの優先順位リスト
  const codecPriorityOrder: AudioCodecTag[] = ['aac', 'vorbis', 'mp3', 'opus', 'flac']
  const codecs: AudioCodecOption[] = codecPriorityOrder.map((tag) => ({
    codec: CODEC_MAP[tag].str,
  }))

  // サポートされている設定を探す
  const supportedConfig = await findSupportedConfig(config, codecs)
  if (!supportedConfig) {
    return { codecInfo: null, config: null }
  }

  // 見つかった設定に対応するコーデック情報をマッピング
  const codecInfo = mapCodecToInfo(supportedConfig.codec)
  return {
    codecInfo,
    config: supportedConfig,
  }
}

/**
 * サポートされているコーデック設定を見つける関数
 *
 * @param baseConfig - 基本となるエンコーダ設定
 * @param codecs - 試行するコーデックのリスト
 * @returns サポートされている設定、または見つからない場合はnull
 */
async function findSupportedConfig(
  baseConfig: Omit<AudioEncoderConfig, 'codec'>,
  codecs: AudioCodecOption[],
): Promise<AudioEncoderConfig | null> {
  for (const { codec } of codecs) {
    // 各コーデックでサポート状況をチェック
    const encodeSupport = await AudioEncoder.isConfigSupported({
      ...baseConfig,
      codec,
    })
    if (encodeSupport.supported && encodeSupport.config) {
      return encodeSupport.config
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
function mapCodecToInfo(codec: string | undefined): AudioCodecInfo | null {
  // codecStrの値からキーを逆引きする
  const entry = Object.entries(CODEC_MAP).find(([, data]) => data.str === codec)

  if (entry) {
    const [codecTag, data] = entry as [AudioCodecTag, { str: string; id: AudioMatroskaId }]
    return {
      codec: data.str,
      codecTag,
      matroskaId: data.id,
    }
  }

  return null
}
