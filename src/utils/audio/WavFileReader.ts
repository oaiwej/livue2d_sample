import type { WavFormat } from './type/WavFormat'

/**
 * WAVファイルを読み込むためのクラス
 */
export class WavFileReader {
  private readonly buffer: ArrayBuffer
  private readonly dataView: DataView
  private dataOffset: number = 0
  private format: WavFormat = {
    channels: 0,
    sampleRate: 0,
    bitsPerSample: 0,
  }

  constructor(buffer: ArrayBuffer) {
    this.buffer = buffer
    this.dataView = new DataView(buffer)
    this.parseHeader()
  }

  /**
   * WAVファイルのヘッダー情報を解析する
   * @throws {Error} 無効なWAVファイル形式やデータが見つからない場合
   */
  private parseHeader(): void {
    const decoder = new TextDecoder('ascii')

    // WAVファイルヘッダーを検証
    if (
      decoder.decode(this.buffer.slice(0, 4)) !== 'RIFF' ||
      decoder.decode(this.buffer.slice(8, 12)) !== 'WAVE'
    ) {
      throw new Error('Invalid WAV file format')
    }

    let offset = 12
    while (offset < this.buffer.byteLength) {
      const chunkId = decoder.decode(this.buffer.slice(offset, offset + 4))
      const chunkSize = this.dataView.getUint32(offset + 4, true)

      if (chunkId === 'fmt ') {
        // フォーマットチャンクを解析
        this.format.channels = this.dataView.getUint16(offset + 10, true)
        this.format.sampleRate = this.dataView.getUint32(offset + 12, true)
        this.format.bitsPerSample = this.dataView.getUint16(offset + 22, true)
      } else if (chunkId === 'data') {
        // データチャンクを見つけたらオフセットを記録して終了
        this.dataOffset = offset + 8
        break
      }

      offset += 8 + chunkSize
    }

    if (this.dataOffset === 0) {
      throw new Error('No audio data found in WAV file')
    }
  }

  /**
   * WAVファイルのヘッダー部分を取得する
   */
  public getHeader(): ArrayBuffer {
    return this.buffer.slice(0, this.dataOffset)
  }

  /**
   * WAVファイルの音声データ部分を取得する
   */
  public getBody(): ArrayBuffer {
    return this.buffer.slice(this.dataOffset)
  }

  /**
   * Waveファイルのフォーマット情報を取得する
   */
  public getFormat(): WavFormat {
    return { ...this.format }
  }

  /**
   * 音声データの長さをミリ秒単位で取得する
   */
  public getDurationMs(): number {
    const bytesPerSample = this.format.channels * (this.format.bitsPerSample / 8)
    return (this.getBody().byteLength / (this.format.sampleRate * bytesPerSample)) * 1000
  }

  /**
   * 音声データを取得する
   */
  public getBuffer(): ArrayBuffer {
    return this.buffer
  }

  /**
   * サンプル数を取得する
   */
  public getNumSamples(): number {
    const bytesPerSample = this.format.channels * (this.format.bitsPerSample / 8)
    return this.getBody().byteLength / bytesPerSample
  }
}
