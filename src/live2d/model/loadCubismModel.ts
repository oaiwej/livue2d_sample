import { CubismMoc } from '@framework/model/cubismmoc'
import type { CubismModel } from '@framework/model/cubismmodel'

/**
 * Cubism モデルをロードする関数
 *
 * @param moc - 事前にロードされた CubismMoc オブジェクト
 * @returns 生成された CubismModel オブジェクト、失敗した場合は null
 * @description
 * この関数は与えられた CubismMoc オブジェクトから新しい CubismModel を作成します。
 * モデル作成後、初期パラメータを保存します。これにより後でパラメータをリセットする際に
 * 初期状態に戻すことができます。
 */
export async function loadCubismModel(moc: CubismMoc): Promise<CubismModel | null> {
  try {
    // CubismMoc からモデルを作成
    const model = moc.createModel()

    // 初期パラメータを保存
    model.saveParameters()

    return model
  } catch (error) {
    console.error('Cubism モデルのロードに失敗しました:', error)
    return null
  }
}
