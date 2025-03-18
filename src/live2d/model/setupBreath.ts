import { CubismDefaultParameterId } from '@framework/cubismdefaultparameterid'
import { BreathParameterData, CubismBreath } from '@framework/effect/cubismbreath'
import { CubismFramework } from '@framework/live2dcubismframework'
import { csmVector } from '@framework/type/csmvector'

/**
 * Live2Dモデルの呼吸機能をセットアップする関数
 *
 * @returns 設定済みのCubismBreathインスタンス
 */
export function setupBreath(): CubismBreath {
  // 呼吸インスタンスの作成
  const breath = CubismBreath.create()

  // 各パラメータのIDを取得
  const parameterIds = {
    angleX: CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamAngleX),
    angleY: CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamAngleY),
    angleZ: CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamAngleZ),
    bodyAngleX: CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamBodyAngleX),
    breath: CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamBreath),
  }

  // 呼吸パラメータの設定
  const breathParameters: csmVector<BreathParameterData> = new csmVector()
  breathParameters.pushBack(new BreathParameterData(parameterIds.angleX, 0.0, 15.0, 6.5345, 0.5))
  breathParameters.pushBack(new BreathParameterData(parameterIds.angleY, 0.0, 8.0, 3.5345, 0.5))
  breathParameters.pushBack(new BreathParameterData(parameterIds.angleZ, 0.0, 10.0, 5.5345, 0.5))
  breathParameters.pushBack(
    new BreathParameterData(parameterIds.bodyAngleX, 0.0, 4.0, 15.5345, 0.5),
  )
  breathParameters.pushBack(new BreathParameterData(parameterIds.breath, 0.5, 0.5, 3.2345, 1.0))

  // 呼吸パラメータをbreathインスタンスに設定
  breath.setParameters(breathParameters)

  return breath
}
