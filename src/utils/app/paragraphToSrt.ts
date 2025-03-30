import { formatSrtTime } from '../subtitle/srt/formatSrtTime'
import type { Paragraph } from './type/Paragraph'

/**
 * ParagraphsをSrtに変換
 * @param paragraphs Paragraphs
 * @returns Srt
 */
export function paragraphToSrt(paragraphs: Paragraph[]): string {
  return (
    paragraphs
      .map((paragraph, index) => {
        const start = formatSrtTime(paragraph.start)
        const end = formatSrtTime(paragraph.end)
        const text = paragraph.text.replace(/\n/g, '\r\n').replace(/\r\n\r\n/g, '\r\n')
        return `${index + 1}\r\n${start} --> ${end}\r\n${text}`
      })
      .join('\r\n\r\n') + '\r\n\r\n'
  )
}
