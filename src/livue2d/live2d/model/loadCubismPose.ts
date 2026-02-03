import { logger } from '@/logger'
import { CubismPose } from '@framework/effect/cubismpose'
import type { ICubismModelSetting } from '@framework/icubismmodelsetting'
import { loadFileAsBytes } from '../utils/loadFileAsBytes'

/**
 * バイナリデータからポーズデータを読み込む内部関数
 * @param buffer pose3.jsonファイルのバイナリデータが格納されたArrayBuffer
 * @returns 生成されたCubismPoseオブジェクト、読み込みに失敗した場合はnull
 */
function loadPose(buffer: ArrayBuffer): CubismPose | null {
  // バッファが無効な場合は早期リターン
  if (!buffer || buffer.byteLength === 0) {
    return null
  }

  // CubismPoseオブジェクトを生成して返す
  return CubismPose.create(buffer, buffer.byteLength)
}

/**
 * モデル設定からポーズデータを非同期で読み込む
 * @param dir モデルのリソースが配置されているディレクトリのパス（末尾に/が必要）
 * @param modelSetting Live2Dモデルの設定情報を含むオブジェクト
 * @returns 読み込まれたCubismPoseオブジェクト。ポーズ設定がない場合や読み込みに失敗した場合はnull
 */
export async function loadCubismPose(
  dir: string,
  modelSetting: ICubismModelSetting,
): Promise<CubismPose | null> {
  // ポーズファイル名を取得
  const poseFileName = modelSetting.getPoseFileName()

  // ポーズファイルが設定されていない場合は早期リターン
  if (!poseFileName) {
    return null
  }

  // ファイルを読み込む
  const filePath = `${dir}${poseFileName}`
  const buffer = await loadFileAsBytes(filePath)

  // ポーズデータを生成
  const pose = loadPose(buffer)

  // 読み込み失敗時のログ出力と早期リターン
  if (!pose) {
    logger.warn(`ポーズデータの読み込みに失敗しました: ${filePath}`)
    return null
  }

  return pose
}
