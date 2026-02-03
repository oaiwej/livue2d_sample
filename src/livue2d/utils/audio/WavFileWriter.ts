import type { WavFormat } from './type/WavFormat'
import type { WavFileReader } from './WavFileReader'

/**
 * WAVファイルを作成・編集するためのクラス
 */
export class WavFileWriter {
  private body: ArrayBuffer
  private readonly format: WavFormat

  /**
   * @param sampleRate サンプルレート
   * @param bitsPerSample サンプルあたりのビット数
   * @param channels チャンネル数
   * @param body 初期音声データ（オプション）
   */
  constructor(format: WavFormat, body: ArrayBuffer = new ArrayBuffer(0)) {
    this.format = { ...format }
    this.body = body
  }

  /**
   * 複数のArrayBufferを連結する
   * @param buffers 連結するバッファ配列
   */
  static concatArrayBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
    const totalSize = buffers.reduce((acc, buffer) => acc + buffer.byteLength, 0)
    const result = new Uint8Array(totalSize)
    let offset = 0

    for (const buffer of buffers) {
      result.set(new Uint8Array(buffer), offset)
      offset += buffer.byteLength
    }

    return result.buffer
  }

  /**
   * 無音のWAVファイルを作成する
   * @param durationMs 長さ（ミリ秒）
   * @param format WAVファイルのフォーマット情報
   */
  static createSilence(durationMs: number, format: WavFormat): WavFileWriter {
    const { sampleRate, bitsPerSample, channels } = format
    const numSamples = Math.ceil((durationMs * sampleRate) / 1000)
    const bytesPerSample = channels * (bitsPerSample / 8)
    const bodyLength = numSamples * bytesPerSample
    const body = new ArrayBuffer(bodyLength)

    return new WavFileWriter(format, body)
  }

  /**
   * 複数のWAVファイルを末尾に追加する
   * @param wavFiles 追加するWAVファイル配列
   */
  public append(wavFiles: WavFileReader[]): void {
    if (wavFiles.length === 0) {
      return
    }

    const bodyBuffers = [this.body, ...wavFiles.map((file) => file.getBody())]
    this.body = WavFileWriter.concatArrayBuffers(bodyBuffers)
  }

  /**
   * ファイルヘッダーを取得する
   */
  protected getHeader(): ArrayBuffer {
    const header = new ArrayBuffer(44)
    const view = new DataView(header)
    const bytesPerSample = this.format.channels * (this.format.bitsPerSample / 8)
    const byteRate = this.format.sampleRate * bytesPerSample

    // RIFF チャンク
    const encoder = new TextEncoder()
    new Uint8Array(header, 0, 4).set(encoder.encode('RIFF'))
    view.setUint32(4, header.byteLength + this.body.byteLength - 8, true)
    new Uint8Array(header, 8, 4).set(encoder.encode('WAVE'))

    // fmt チャンク
    new Uint8Array(header, 12, 4).set(encoder.encode('fmt '))
    view.setUint32(16, 16, true) // fmtチャンクサイズ
    view.setUint16(20, 1, true) // PCM format
    view.setUint16(22, this.format.channels, true)
    view.setUint32(24, this.format.sampleRate, true)
    view.setUint32(28, byteRate, true)
    view.setUint16(32, bytesPerSample, true)
    view.setUint16(34, this.format.bitsPerSample, true)

    // data チャンク
    new Uint8Array(header, 36, 4).set(encoder.encode('data'))
    view.setUint32(40, this.body.byteLength, true)
    return header
  }

  public getBody(): ArrayBuffer {
    return this.body
  }

  /**
   * 完成したWAVファイルのバッファを取得する
   */
  public getBuffer(): ArrayBuffer {
    return WavFileWriter.concatArrayBuffers([this.getHeader(), this.body])
  }

  /**
   * ミリ秒をバイト数に変換する
   * @param ms ミリ秒
   */
  protected msToBytes(ms: number): number {
    const bytesPerSecond =
      this.format.sampleRate * this.format.channels * (this.format.bitsPerSample / 8)
    return Math.floor((ms * bytesPerSecond) / 1000)
  }

  /**
   * 指定位置に音声データを上書きする
   * @param byteOffset 上書き開始位置（バイト）
   * @param wav 上書きする音声データ
   */
  public overwriteAudioAtByteOffset(byteOffset: number, wav: WavFileReader): void {
    const insertData = new Uint8Array(wav.getBody())
    const requiredSize = byteOffset + insertData.byteLength

    // バッファが足りない場合は拡張
    if (requiredSize > this.body.byteLength) {
      const newBody = new Uint8Array(requiredSize)
      newBody.set(new Uint8Array(this.body))
      this.body = newBody.buffer
    }

    // 指定位置に音声を上書き
    new Uint8Array(this.body).set(insertData, byteOffset)
  }

  /**
   * 指定位置に音声データを上書きする
   * @param positionMs 上書き開始位置（ミリ秒）
   * @param wav 上書きする音声データ
   */
  public overwriteAudioAtTimePosition(positionMs: number, wav: WavFileReader): void {
    const byteOffset = this.msToBytes(positionMs)
    this.overwriteAudioAtByteOffset(byteOffset, wav)
  }
}
