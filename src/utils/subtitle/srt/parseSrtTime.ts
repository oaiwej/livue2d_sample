/**
 * Parse SRT time format
 * @param time SRT time format
 */
export function parseSrtTime(time: string): number {
  const [hours, minutes, seconds, milliseconds] = time.split(/[:,]/).map(Number)
  return hours * 3600 * 1000 + minutes * 60 * 1000 + seconds * 1000 + (milliseconds ?? 0)
}
