/**
 * 音声データを再生する準備を行い、Audio要素で再生する
 *
 * @param wavBuffer 再生するWAVデータ
 * @param callbacks コールバック関数 (onplay, onended)
 * @param state 状態管理オブジェクト (audioRef, wavUrlRef)
 * @returns 作成されたBlobのURL
 */
export function prepareAndPlayAudio(
  wavBuffer: ArrayBuffer,
  callbacks: {
    onplay?: () => void
    onended?: () => void
  },
  state: {
    audioRef: { value: HTMLAudioElement | null }
    wavUrlRef: { value: string | null }
  },
): void {
  // 既存の音声データのリソースを解放
  if (state.wavUrlRef.value) {
    URL.revokeObjectURL(state.wavUrlRef.value)
  }

  // 再生中の音声があれば停止
  if (state.audioRef.value) {
    state.audioRef.value.pause()
    state.audioRef.value.currentTime = 0
    state.audioRef.value = null
  }

  // BlobオブジェクトとしてURLを生成
  state.wavUrlRef.value = URL.createObjectURL(new Blob([wavBuffer], { type: 'audio/wav' }))
  if (!state.wavUrlRef.value) {
    return
  }

  // 音声オブジェクトを生成して再生
  state.audioRef.value = new Audio(state.wavUrlRef.value)

  if (callbacks.onplay) {
    state.audioRef.value.onplay = callbacks.onplay
  }

  if (callbacks.onended) {
    state.audioRef.value.onended = callbacks.onended
  }

  state.audioRef.value.play()
}
