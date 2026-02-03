export function formatSrtTime(timeMs: number): string {
  const hours = Math.floor(timeMs / 3600000)
  const minutes = Math.floor((timeMs % 3600000) / 60000)
  const seconds = Math.floor((timeMs % 60000) / 1000)
  const milliseconds = Math.floor(timeMs % 1000)

  const hh = String(hours).padStart(2, '0')
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  const ms = String(milliseconds).padStart(3, '0')

  return `${hh}:${mm}:${ss},${ms}`
}
