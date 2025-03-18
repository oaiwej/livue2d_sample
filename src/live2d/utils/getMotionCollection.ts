import type { ICubismModelSetting } from '@framework/icubismmodelsetting'

export interface MotionInfo {
  group: string
  filename: string
  index: number
}

export interface MotionCollection {
  [key: string]: MotionInfo[]
}

export function getMotionCollection(modelSetting: ICubismModelSetting): MotionCollection {
  const motionInfoList: MotionCollection = {}
  const motionGroupCount = modelSetting.getMotionGroupCount()
  for (let i = 0; i < motionGroupCount; i++) {
    const group = modelSetting.getMotionGroupName(i)
    const motionCount = modelSetting.getMotionCount(group)
    motionInfoList[group] = []
    for (let j = 0; j < motionCount; j++) {
      motionInfoList[group].push({
        group,
        filename: modelSetting.getMotionFileName(group, j),
        index: j,
      })
    }
  }
  return motionInfoList
}
