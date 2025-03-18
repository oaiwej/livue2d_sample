import type { ICubismModelSetting } from '@framework/icubismmodelsetting'
import type { CubismIdHandle } from '@framework/id/cubismid'
import { csmVector } from '@framework/type/csmvector'

/**
 * リップシンク（口の動き）のパラメータIDを取得する関数
 *
 * @param modelSetting - Live2Dモデル設定情報
 * @returns モデルのリップシンクパラメータIDのベクトル配列
 */
export function setupLipsyncIds(modelSetting: ICubismModelSetting): csmVector<CubismIdHandle> {
  // リップシンクパラメータIDを格納するベクトル配列を初期化
  const lipsyncIds = new csmVector<CubismIdHandle>()

  // モデル設定からリップシンクパラメータの数を取得
  const lipsyncCount = modelSetting.getLipSyncParameterCount()

  // 全てのリップシンクパラメータIDを取得してベクトル配列に追加
  for (let i = 0; i < lipsyncCount; i++) {
    lipsyncIds.pushBack(modelSetting.getLipSyncParameterId(i))
  }

  return lipsyncIds
}
