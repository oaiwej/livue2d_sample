import type { ICubismModelSetting } from '@framework/icubismmodelsetting'

export interface ExpressionInfo {
  filename: string
  name: string
  index: number
}

export type ExpressionInfoList = ExpressionInfo[]

export function getExpressionList(modelSetting: ICubismModelSetting): ExpressionInfoList {
  const expressionInfoList: ExpressionInfoList = []
  const expressionCount = modelSetting.getExpressionCount()
  for (let i = 0; i < expressionCount; i++) {
    expressionInfoList.push({
      filename: modelSetting.getExpressionFileName(i),
      name: modelSetting.getExpressionName(i),
      index: i,
    })
  }
  return expressionInfoList
}
