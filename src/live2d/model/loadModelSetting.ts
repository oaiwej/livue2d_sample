import { CubismModelSettingJson } from '@framework/cubismmodelsettingjson'
import { ICubismModelSetting } from '@framework/icubismmodelsetting'
import { loadFileAsBytes } from '../utils/loadFileAsBytes'

/**
 * Live2Dモデルの設定ファイル(model3.json)を読み込み、モデル設定オブジェクトを生成する
 *
 * このモデル設定は、テクスチャ、物理演算設定、ポーズ設定などのLive2Dモデルを
 * 表示するために必要な各種アセット情報を含んでいる。
 *
 * @param dir - モデルファイルが格納されているディレクトリのパス（末尾に/を含む）
 * @param fileName - 読み込むモデル設定ファイルの名前（通常はmodel3.json）
 * @returns モデル設定を扱うためのICubismModelSettingインタフェース
 */
export async function loadModelSetting(
  dir: string,
  fileName: string,
): Promise<ICubismModelSetting> {
  const filePath = `${dir}${fileName}`
  const buffer = await loadFileAsBytes(filePath)
  return new CubismModelSettingJson(buffer, buffer.byteLength)
}
