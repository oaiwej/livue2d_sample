import { logger } from '@/logger'
import { ICubismModelSetting } from '@framework/icubismmodelsetting'
import { CubismMoc } from '@framework/model/cubismmoc'
import { loadFileAsBytes } from '../utils/loadFileAsBytes'

/**
 * Live2Dモデルのmoc3ファイルをバッファから読み込み、CubismMocオブジェクトを生成する
 *
 * @param buffer - moc3ファイルが読み込まれているArrayBuffer
 * @param shouldCheckMocConsistency - モデルデータの整合性チェックを行うかどうか（デフォルト: false）
 * @returns 成功した場合はCubismMocオブジェクト、失敗した場合はnull
 */
function loadMoc(
  buffer: ArrayBuffer,
  shouldCheckMocConsistency: boolean = false,
): CubismMoc | null {
  // バッファが無効な場合は処理を中断
  if (!buffer || buffer.byteLength === 0) {
    return null
  }

  // CubismMocオブジェクトを生成して返す
  return CubismMoc.create(buffer, shouldCheckMocConsistency)
}

/**
 * モデル設定情報からmoc3ファイルのパスを取得し、ファイルを読み込んでCubismMocオブジェクトを生成する
 *
 * @param dir - Live2Dモデルのファイルが配置されているディレクトリパス（末尾に/が必要）
 * @param modelSetting - モデル設定情報を含むICubismModelSettingオブジェクト
 * @returns 成功した場合はCubismMocオブジェクトを含むPromise、失敗した場合はnullを含むPromise
 */
export async function loadCubismMoc(
  dir: string,
  modelSetting: ICubismModelSetting,
): Promise<CubismMoc | null> {
  // モデル設定からモデルファイル名を取得
  const modelFileName = modelSetting.getModelFileName()

  // モデルファイル名が設定されていない場合は処理を中断
  if (!modelFileName) {
    logger.warn('モデルファイル名が見つかりませんでした')
    return null
  }

  // モデルファイルのフルパス
  const modelPath = `${dir}${modelFileName}`

  try {
    // ファイルをバイト配列として読み込む
    const buffer = await loadFileAsBytes(modelPath)

    // バッファからCubismMocオブジェクトを生成
    const moc = loadMoc(buffer, true)

    // 読み込み失敗時はログを出力
    if (!moc) {
      logger.warn(`Mocファイルの読み込みに失敗しました: ${modelPath}`)
    }

    return moc
  } catch (error) {
    logger.error(`Mocファイルの読み込み中にエラーが発生しました: ${modelPath}`, error)
    return null
  }
}
