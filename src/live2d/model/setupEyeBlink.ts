import { CubismEyeBlink } from '@framework/effect/cubismeyeblink'
import type { ICubismModelSetting } from '@framework/icubismmodelsetting'

/**
 * Live2Dモデルのまばたき機能をセットアップする
 *
 * モデル設定から目のパラメータを取得し、まばたきの動作を制御するための
 * CubismEyeBlinkインスタンスを生成する。
 *
 * @param modelSetting Live2Dモデルの設定情報を含むオブジェクト
 * @returns 設定されたまばたき制御用のCubismEyeBlinkインスタンス
 */
export function setupEyeBlink(modelSetting: ICubismModelSetting): CubismEyeBlink {
  return CubismEyeBlink.create(modelSetting)
}
