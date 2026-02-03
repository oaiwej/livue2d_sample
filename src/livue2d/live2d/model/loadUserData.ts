import { ICubismModelSetting } from '@framework/icubismmodelsetting'
import { CubismModelUserData } from '@framework/model/cubismmodeluserdata'
import { loadFileAsBytes } from '../utils/loadFileAsBytes'

/**
 * Live2Dモデルのユーザーデータを読み込む関数
 *
 * モデル設定ファイルに指定されているユーザーデータファイルを読み込み、
 * CubismModelUserDataオブジェクトとして返却します。
 * ユーザーデータファイルが指定されていない場合はnullを返します。
 *
 * @param dir モデルのファイルが配置されているディレクトリのパス（末尾にスラッシュを含む）
 * @param modelSetting モデル設定情報を含むICubismModelSettingインスタンス
 * @returns ユーザーデータオブジェクト、またはユーザーデータが存在しない場合はnull
 */
export async function loadUserData(
  dir: string,
  modelSetting: ICubismModelSetting,
): Promise<CubismModelUserData | null> {
  // ユーザーデータファイルの名前を取得
  const userDataFile = modelSetting.getUserDataFile()

  // ユーザーデータファイルが設定されていない場合はnullを返す
  if (!userDataFile) {
    return null
  }

  // ユーザーデータファイルをバイナリとして読み込む
  const buffer = await loadFileAsBytes(`${dir}${userDataFile}`)

  // 読み込んだバイナリデータからユーザーデータオブジェクトを作成
  return CubismModelUserData.create(buffer, buffer.byteLength)
}
