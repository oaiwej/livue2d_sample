import { v4 as uuid } from 'uuid'
import type { Srt } from '../subtitle/srt/type/Srt'
import { DEFAULT_PARAGRAPH, type Paragraph } from './type/Paragraph'

/**
 * SrtからParagraphsに変換
 * @param srt Srt
 * @returns Paragraphs
 */
export function paragraphsFromSrt(
  srt: Srt,
  defaultParagraph: Paragraph = DEFAULT_PARAGRAPH,
): Paragraph[] {
  return srt.map((segment) => ({
    ...defaultParagraph,
    id: uuid(),
    start: segment.start,
    end: segment.end,
    text: segment.text,
  }))
}
