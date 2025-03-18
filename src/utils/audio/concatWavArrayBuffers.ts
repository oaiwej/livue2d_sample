/**
 * 複数のWAVファイルArrayBufferを連結してArrayBufferを返す
 * @param buffers 連結するWAVデータのバッファ配列
 * @returns 連結されたWAVデータのURL
 */
export function concatWavArrayBuffers(buffers: ArrayBuffer[]) {
  if (buffers.length === 0) return null
  if (buffers.length === 1) return buffers[0]

  // WAVヘッダは通常44バイト
  const WAV_HEADER_SIZE = 44

  // データサイズを計算（各ファイルのデータ部分のみ）
  let totalDataSize = 0
  for (const buffer of buffers) {
    totalDataSize += buffer.byteLength - WAV_HEADER_SIZE
  }

  // 新しいWAVファイル用のバッファを作成
  const resultBuffer = new ArrayBuffer(WAV_HEADER_SIZE + totalDataSize)
  const resultView = new DataView(resultBuffer)

  // 最初のファイルからヘッダをコピー
  const headerArray = new Uint8Array(buffers[0].slice(0, WAV_HEADER_SIZE))
  new Uint8Array(resultBuffer, 0, WAV_HEADER_SIZE).set(headerArray)

  // データサイズを更新（4バイト目から4バイト）
  resultView.setUint32(4, 36 + totalDataSize, true)
  // データチャンクサイズを更新（40バイト目から4バイト）
  resultView.setUint32(40, totalDataSize, true)

  // 各ファイルのデータ部分をコピー
  let offset = WAV_HEADER_SIZE
  for (const buffer of buffers) {
    const dataArray = new Uint8Array(buffer.slice(WAV_HEADER_SIZE))
    new Uint8Array(resultBuffer, offset, dataArray.length).set(dataArray)
    offset += dataArray.length
  }

  return resultBuffer
}
