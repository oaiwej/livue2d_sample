export const EXPRESSION_TYPES = [
  'auto',
  'normal',
  'happy',
  'sad',
  'angry',
  'surprised',
  'blush',
] as const

export type ExpressionType = (typeof EXPRESSION_TYPES)[number]
