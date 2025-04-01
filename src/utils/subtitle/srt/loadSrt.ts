import { parseSrtTime } from './parseSrtTime'
import type { Srt } from './type/Srt'

/**
 * Load SRT file
 * @param file SRT file
 */
export function loadSrt(file: File): Promise<Srt> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const srtText = event.target?.result as string
      const segments: Srt = srtText
        .split(/(?:\r?\n){2,}/)
        .filter((segment) => {
          return segment.match(
            /^\d+\r?\n\d{1,2}:\d{2}:\d{2}(?:,\d{1,3})? --> \d{1,2}:\d{2}:\d{2}(?:,\d{1,3})?/,
          )
        })
        .map((segment) => {
          const lines = segment.split(/\r?\n/)
          const times = lines[1].split(' --> ')
          return {
            start: parseSrtTime(times[0]),
            end: parseSrtTime(times[1]),
            text: lines.slice(2).join('\n'),
          }
        })
      resolve(segments)
    }
    reader.onerror = (event) => {
      reject(event)
    }
    reader.readAsText(file)
  })
}
