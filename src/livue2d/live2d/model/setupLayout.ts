import type { ICubismModelSetting } from '@framework/icubismmodelsetting'
import type { CubismModelMatrix } from '@framework/math/cubismmodelmatrix'
import { csmMap } from '@framework/type/csmmap'

/**
 * Live2Dモデルのレイアウト情報を設定する
 *
 * @param modelSetting - モデル設定情報を含むオブジェクト
 * @param modelMatrix - モデル変換行列
 * @returns レイアウト情報を格納したマップオブジェクト
 */
export function setupLayout(
  modelSetting: ICubismModelSetting,
  modelMatrix: CubismModelMatrix,
): csmMap<string, number> {
  // レイアウト情報を格納するマップを作成
  const layout = new csmMap<string, number>()

  // モデル設定からレイアウト情報を取得
  modelSetting.getLayoutMap(layout)

  // モデル行列にレイアウト情報を適用
  modelMatrix.setupFromLayout(layout)

  return layout
}
