import { logger } from '@/logger'
import type { ICubismModelSetting } from '@framework/icubismmodelsetting'
import { ACubismMotion } from '@framework/motion/acubismmotion'
import { CubismExpressionMotion } from '@framework/motion/cubismexpressionmotion'
import { csmMap } from '@framework/type/csmmap'
import { loadFileAsBytes } from '../utils/loadFileAsBytes'

/**
 * 表情モーションファイルからモーションを生成する
 *
 * @param buffer ファイルの内容が格納されたバッファ
 * @returns 生成されたモーションオブジェクト、失敗時はnullを返す
 */
function loadExpression(buffer: ArrayBuffer): ACubismMotion | null {
  // バッファが無効な場合は早期リターン
  if (!buffer || buffer.byteLength === 0) {
    return null
  }

  // CubismExpressionMotionを生成して返す
  return CubismExpressionMotion.create(buffer, buffer.byteLength)
}

/**
 * Live2Dモデルの表情データを全て読み込む
 *
 * モデル設定ファイル内で定義されているすべての表情を読み込み、
 * 名前をキーとしたマップとして返却する
 *
 * @param dir モデルのファイルが配置されているディレクトリのパス
 * @param modelSetting モデル設定情報を含むオブジェクト
 * @returns 表情名をキー、モーションオブジェクトを値とするマップ
 */
export async function loadCubismExpression(
  dir: string,
  modelSetting: ICubismModelSetting,
): Promise<csmMap<string, ACubismMotion>> {
  const expressions: csmMap<string, ACubismMotion> = new csmMap()
  const expressionCount = modelSetting.getExpressionCount()

  // 全ての表情データを順に読み込む
  for (let i = 0; i < expressionCount; i++) {
    const expressionName = modelSetting.getExpressionName(i)
    const expressionFileName = modelSetting.getExpressionFileName(i)
    const filePath = `${dir}${expressionFileName}`

    try {
      // ファイルをバイナリとして読み込み
      const buffer = await loadFileAsBytes(filePath)
      const motion = loadExpression(buffer)

      if (motion) {
        // 同名の表情が既に存在する場合は解放してから新しい表情を登録
        const existingMotion = expressions.getValue(expressionName)
        if (existingMotion) {
          ACubismMotion.delete(existingMotion)
        }
        expressions.setValue(expressionName, motion)
      } else {
        logger.warn(`表情データの読み込みに失敗しました: ${filePath}`)
      }
    } catch (error) {
      logger.warn(`表情ファイルの読み込み中にエラーが発生しました: ${filePath}`, error)
    }
  }

  return expressions
}
