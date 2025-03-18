import { CubismModelMatrix } from '@framework/math/cubismmodelmatrix'
import type { CubismModel } from '@framework/model/cubismmodel'

/**
 * CubismModelのモデルマトリックスを設定します。
 * モデルのキャンバス幅と高さを基にCubismModelMatrixを作成し、返却します。
 * このマトリックスはモデルの位置、スケール、回転などの変換を管理するために使用されます。
 *
 * @param model - マトリックスを設定するCubismModelインスタンス
 * @returns 作成されたCubismModelMatrixインスタンス
 */
export function setupModelMatrix(model: CubismModel): CubismModelMatrix {
  const modelMatrix = new CubismModelMatrix(model.getCanvasWidth(), model.getCanvasHeight())
  return modelMatrix
}
