import type { ExpressionType } from './ExpressionType'

export type ExpressionMapKey = Exclude<ExpressionType, 'auto'>
export type ExpressionMapValue = {
  motionGroupName: string
  motionIndex: number
  expressionIndex: number | null
}

/**
 * ExpressionMap
 * @description
 * - motionGroupName: The name of the motion group
 * - motionIndex: The index of the motion in the motion group
 * - expressionIndex: The index of the expression in the motion
 */
export type ExpressionMap = Record<ExpressionMapKey, ExpressionMapValue>

export const DEFAULT_EXPRESSION_MAP_VALUE: ExpressionMapValue = {
  motionGroupName: 'Idle',
  motionIndex: 0,
  expressionIndex: null,
} as const

export const DEFAULT_EXPRESSION_MAP: ExpressionMap = {
  normal: { ...DEFAULT_EXPRESSION_MAP_VALUE },
  happy: { ...DEFAULT_EXPRESSION_MAP_VALUE },
  sad: { ...DEFAULT_EXPRESSION_MAP_VALUE },
  angry: { ...DEFAULT_EXPRESSION_MAP_VALUE },
  surprised: { ...DEFAULT_EXPRESSION_MAP_VALUE },
  blush: { ...DEFAULT_EXPRESSION_MAP_VALUE },
} as const
