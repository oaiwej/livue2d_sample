import { logger } from '@/logger'
import type { ICubismModelSetting } from '@framework/icubismmodelsetting'
import type { CubismModel } from '@framework/model/cubismmodel'
import { CubismMotion } from '@framework/motion/cubismmotion'
import { csmMap } from '@framework/type/csmmap'
import { loadFileAsBytes } from '../utils/loadFileAsBytes'

/**
 * モーションデータをバッファから読み込み、CubismMotionオブジェクトを生成する
 * @param buffer motion3.jsonファイルが読み込まれているバイナリデータ
 * @returns 生成されたCubismMotionオブジェクト、失敗時はnull
 */
function loadMotion(buffer: ArrayBuffer): CubismMotion | null {
  if (!buffer || buffer.byteLength === 0) {
    return null
  }
  return CubismMotion.create(buffer, buffer.byteLength)
}

/**
 * Live2Dモデルのモーションデータを全て読み込む
 * @param dir モデルデータのあるディレクトリパス（末尾に/が必要）
 * @param model 対象のCubismModelインスタンス
 * @param modelSetting モデル設定情報
 * @returns モーションファイル名をキーとしたCubismMotionオブジェクトのマップ
 */
export async function loadCubismMotion(
  dir: string,
  model: CubismModel,
  modelSetting: ICubismModelSetting,
): Promise<csmMap<string, CubismMotion>> {
  // モデルのパラメータを保存
  model.saveParameters()

  const motions: csmMap<string, CubismMotion> = new csmMap()
  const motionGroupCount = modelSetting.getMotionGroupCount()

  // 全てのモーショングループを処理
  for (let i = 0; i < motionGroupCount; i++) {
    const groupName = modelSetting.getMotionGroupName(i)
    const motionCount = modelSetting.getMotionCount(groupName)

    // グループ内の各モーションを処理
    for (let j = 0; j < motionCount; j++) {
      const motionFileName = modelSetting.getMotionFileName(groupName, j)

      // モーションファイル名が取得できない場合はスキップ
      if (!motionFileName) {
        logger.warn(
          `モーションファイル名が取得できませんでした: グループ=${groupName}, インデックス=${j}`,
        )
        continue
      }

      // モーションファイルの読み込み
      const filePath = dir + motionFileName
      const buffer = await loadFileAsBytes(filePath)
      const motion = loadMotion(buffer)

      // モーションの読み込みに失敗した場合はスキップ
      if (!motion) {
        logger.warn(`モーションファイルの読み込みに失敗しました: ${filePath}`)
        continue
      }

      // フェードイン・アウト時間の設定
      configureMotionFadeTime(motion, modelSetting, groupName, j)

      // 既存のモーションがあれば解放してから新しいモーションを設定
      const existingMotion = motions.getValue(motionFileName)
      if (existingMotion) {
        CubismMotion.delete(existingMotion)
      }

      motions.setValue(motionFileName, motion)
    }
  }

  return motions
}

/**
 * モーションのフェードイン・アウト時間を設定する
 * @param motion 設定対象のモーション
 * @param modelSetting モデル設定情報
 * @param groupName モーショングループ名
 * @param index グループ内のモーションインデックス
 */
function configureMotionFadeTime(
  motion: CubismMotion,
  modelSetting: ICubismModelSetting,
  groupName: string,
  index: number,
): void {
  // フェードイン時間の設定
  const fadeInTime = modelSetting.getMotionFadeInTimeValue(groupName, index)
  if (fadeInTime >= 0.0) {
    motion.setFadeInTime(fadeInTime)
  }

  // フェードアウト時間の設定
  const fadeOutTime = modelSetting.getMotionFadeOutTimeValue(groupName, index)
  if (fadeOutTime >= 0.0) {
    motion.setFadeOutTime(fadeOutTime)
  }
}
