/**
 * テキストを文単位に分割する
 * 句読点や改行で区切って文を分割する
 *
 * @param text 分割する文章
 * @returns 分割された文の配列
 */
export function splitSentence(text: string): string[] {
  // 句読点や改行で文を区切るための正規表現

  const pattern = /(?<=[。？！…⋯\.\,\?\!])(?![。？…⋯！\.\,\?\!])/
  return text.replace(/[\r\n]/g, '').split(pattern)
}
