import { logger } from '@/logger'
import type { ICubismModelSetting } from '@framework/icubismmodelsetting'
import { CubismPhysics } from '@framework/physics/cubismphysics'
import { loadFileAsBytes } from '../utils/loadFileAsBytes'

/**
 * 物理演算データをバッファから読み込み、CubismPhysicsオブジェクトを生成する
 * バッファが無効な場合はnullを返す
 *
 * @param buffer - physics3.jsonファイルの内容が格納されたバッファ
 * @returns 生成されたCubismPhysicsオブジェクト、またはnull（バッファが無効な場合）
 */
function loadPhysics(buffer: ArrayBuffer): CubismPhysics | null {
  // バッファが存在しないか空の場合はnullを返す
  if (!buffer || buffer.byteLength === 0) {
    return null
  }

  // CubismPhysicsオブジェクトを生成して返す
  return CubismPhysics.create(buffer, buffer.byteLength)
}

/**
 * モデル設定から物理演算データファイルを読み込み、CubismPhysicsオブジェクトを生成する
 *
 * @param dir - モデルが配置されているディレクトリパス（末尾に「/」を含む）
 * @param modelSetting - モデル設定オブジェクト
 * @returns 生成されたCubismPhysicsオブジェクト、または以下の場合にnull：
 *          - 物理演算データファイルが指定されていない場合
 *          - 物理演算データファイルの読み込みに失敗した場合
 */
export async function loadCubismPhysics(
  dir: string,
  modelSetting: ICubismModelSetting,
): Promise<CubismPhysics | null> {
  // モデル設定から物理演算ファイル名を取得
  const physicsFileName = modelSetting.getPhysicsFileName()

  // 物理演算ファイルが指定されていない場合はnullを返す
  if (!physicsFileName) {
    return null
  }

  // ファイルをバイト配列として読み込む
  const buffer = await loadFileAsBytes(dir + physicsFileName)

  // 物理演算データの生成
  const physics = loadPhysics(buffer)

  // 生成に失敗した場合はログを出力
  if (!physics) {
    logger.warn(`物理演算データの読み込みに失敗しました: ${dir}${physicsFileName}`)
  }

  return physics
}
