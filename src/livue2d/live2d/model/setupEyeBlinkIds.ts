import type { ICubismModelSetting } from '@CubismSdkForWeb/Framework/src/icubismmodelsetting'
import type { CubismIdHandle } from '@CubismSdkForWeb/Framework/src/id/cubismid'
import { csmVector } from '@CubismSdkForWeb/Framework/src/type/csmvector'

/**
 * Live2DモデルのまばたきパラメータのIDリストを設定する
 *
 * @param modelSetting - Live2Dモデル設定オブジェクト
 * @returns まばたきパラメータIDのベクトル
 */
export function setupEyeBlinkIds(modelSetting: ICubismModelSetting): csmVector<CubismIdHandle> {
  // まばたきパラメータIDを格納するベクトルを作成
  const eyeBlinkIds: csmVector<CubismIdHandle> = new csmVector<CubismIdHandle>()

  // モデル設定からまばたきパラメータの数を取得
  const eyeBlinkCount = modelSetting.getEyeBlinkParameterCount()

  // 全てのまばたきパラメータIDをベクトルに追加
  for (let i = 0; i < eyeBlinkCount; i++) {
    eyeBlinkIds.pushBack(modelSetting.getEyeBlinkParameterId(i))
  }

  return eyeBlinkIds
}
