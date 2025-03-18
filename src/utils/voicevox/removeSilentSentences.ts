export function removeSilentSentences(sentences: string[]): string[] {
  // [^。．‥⋯？！\.\,] のみの文を削除する
  return sentences.filter((sentence) => sentence.match(/^[。．‥⋯？！\.\,]*$/) === null)
}
