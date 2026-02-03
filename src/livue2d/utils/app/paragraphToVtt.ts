import { formaVttTime } from '../subtitle/srt/formatVttTime'
import type { Paragraph } from './type/Paragraph'

/**
 * ParagraphsをWebVttに変換
 * @param paragraphs Paragraphs
 * @returns Srt
 */
export function paragraphToVtt(paragraphs: Paragraph[]): string {
  return (
    'WEBVTT\r\n\r\n' +
    paragraphs
      .filter((paragraph) => paragraph.text.trim() !== '')
      .map((paragraph) => {
        const start = formaVttTime(paragraph.start)
        const end = formaVttTime(paragraph.end)
        const text = paragraph.text.replace(/\r?\n/g, '<br>')
        return `${start} --> ${end}\r\n${text}`
      })
      .join('\r\n\r\n') +
    '\r\n'
  )
}
