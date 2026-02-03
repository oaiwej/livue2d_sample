/**
 * 単一音声の準備・再生・一時停止を管理する軽量プレイヤー
 * - クリックノイズ対策（フェードイン/アウト、DCブロッカ）
 * - 複数バッファの正規化・結合（クロスフェード）
 * - prepare/start の分離で、無音状態の事前準備に対応
 */
export class AudioPlayer {
  private audioContext: AudioContext
  private gainNode: GainNode
  // DC除去用ハイパスフィルタ（直流成分や極低域のズレを軽減）
  private dcBlocker: BiquadFilterNode
  private pannerNode: StereoPannerNode
  private source: AudioBufferSourceNode | null = null
  private audioBuffer: AudioBuffer | null = null

  private _paused: boolean = false
  private _played: boolean = false
  private pausedAt: number = 0
  private startedAt: number = 0

  // Gain management
  // 音量の目標値とフェード時間（秒）
  private targetGain: number = 1.0
  private readonly fadeInSeconds = 0.1 // 100ms
  private readonly fadeOutSeconds = 0.1 // 100ms
  private readonly minGain = 1e-4 // exponential ramp safety floor

  // Event callbacks
  onplay: (() => void) | null = null
  onended: (() => void) | null = null
  onpause: (() => void) | null = null

  constructor() {
    this.audioContext = new AudioContext()
    this.gainNode = this.audioContext.createGain()
    // クリック対策: DCブロッカ（低域をわずかにカット）
    this.dcBlocker = this.audioContext.createBiquadFilter()
    this.dcBlocker.type = 'highpass'
    this.dcBlocker.frequency.value = 30 // 30Hz to remove DC/very low rumble
    this.pannerNode = this.audioContext.createStereoPanner()

    // Connect nodes
    this.gainNode.connect(this.dcBlocker)
    this.dcBlocker.connect(this.pannerNode)
    this.pannerNode.connect(this.audioContext.destination)
  }

  /**
   * 再生せずに音声データを読み込み・デコードして内部に準備する
   */
  async prepare(audioBuffers: ArrayBuffer[]): Promise<void> {
    // Decode and concatenate audio data
    const decodedBuffers = await Promise.all(
      audioBuffers.map((buffer) => this.audioContext.decodeAudioData(buffer.slice(0))),
    )

    if (decodedBuffers.length === 0) {
      return
    }

    // バッファごとのサンプルレート/チャンネル数を正規化
    const targetSampleRate = decodedBuffers[0].sampleRate
    const targetChannels = Math.min(
      2,
      Math.max(...decodedBuffers.map((b) => b.numberOfChannels)) || 1,
    )
    const normalized: AudioBuffer[] = []
    for (const buf of decodedBuffers) {
      if (buf.sampleRate !== targetSampleRate || buf.numberOfChannels !== targetChannels) {
        // Resample/rechannel using OfflineAudioContext
        const tmpCtx = new OfflineAudioContext({
          numberOfChannels: targetChannels,
          length: Math.ceil(buf.duration * targetSampleRate),
          sampleRate: targetSampleRate,
        })
        const src = tmpCtx.createBufferSource()
        // Up/down-mix channels if needed
        const mixed = tmpCtx.createBuffer(
          targetChannels,
          Math.ceil(buf.duration * targetSampleRate),
          targetSampleRate,
        )
        for (let ch = 0; ch < targetChannels; ch++) {
          const srcCh = ch < buf.numberOfChannels ? ch : 0
          mixed.getChannelData(ch).set(buf.getChannelData(srcCh))
        }
        src.buffer = mixed
        src.connect(tmpCtx.destination)
        src.start()
        const rendered = await tmpCtx.startRendering()
        normalized.push(rendered)
      } else {
        normalized.push(buf)
      }
    }

    // 区間境界でのクリックを避けるため、小さなクロスフェードで結合
    const sampleRate = targetSampleRate
    const crossfadeSamples = Math.max(16, Math.floor(sampleRate * 0.005)) // ~5ms
    const totalLength = normalized.reduce(
      (sum, b, i) => sum + b.length - (i > 0 ? crossfadeSamples : 0),
      0,
    )
    const numberOfChannels = targetChannels
    const mergedBuffer = this.audioContext.createBuffer(
      numberOfChannels,
      Math.max(0, totalLength),
      sampleRate,
    )

    let writeOffset = 0
    for (let i = 0; i < normalized.length; i++) {
      const b = normalized[i]
      const overlap = i === 0 ? 0 : crossfadeSamples
      for (let ch = 0; ch < numberOfChannels; ch++) {
        const dst = mergedBuffer.getChannelData(ch)
        const src = b.getChannelData(ch < b.numberOfChannels ? ch : 0)

        if (overlap > 0) {
          // Crossfade region
          for (let n = 0; n < overlap; n++) {
            const t = n / overlap // 0..1
            const prevIdx = writeOffset - overlap + n
            // Safety for bounds
            if (prevIdx >= 0 && prevIdx < dst.length && n < src.length) {
              const prevVal = dst[prevIdx]
              const nextVal = src[n]
              dst[prevIdx] = prevVal * (1 - t) + nextVal * t
            }
          }
        }

        // Copy the remainder after overlap
        const startSrc = overlap
        const copyLen = Math.max(0, src.length - startSrc)
        if (copyLen > 0) {
          dst.set(src.subarray(startSrc, startSrc + copyLen), writeOffset)
        }
      }
      writeOffset += b.length - overlap
    }

    this.audioBuffer = mergedBuffer
  }

  /**
   * 準備済みバッファの再生を開始する
   */
  start(offset: number = 0): void {
    if (!this.audioBuffer) return
    // Stop any currently playing audio (with short fadeout)
    this.stop()
    // Create and start playback (with fadein)
    this._createAndStartSourceNode(offset)
    this._played = true
    this._paused = false
    this.startedAt = this.audioContext.currentTime - offset
    if (this.onplay) this.onplay()
  }

  /**
   * 互換用のショートカット（prepare → start）
   */
  async play(audioBuffers: ArrayBuffer[]): Promise<void> {
    await this.prepare(audioBuffers)
    this.start(0)
  }

  /**
   * 再生停止（短いフェードアウト後に停止）
   */
  stop(): void {
    if (this.source) {
      const now = this.audioContext.currentTime
      // Smooth fade-out to avoid clicks, then stop
      try {
        this.gainNode.gain.cancelScheduledValues(now)
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now)
        // Exponential ramps cannot target 0; ramp to epsilon then set 0
        this.gainNode.gain.exponentialRampToValueAtTime(this.minGain, now + this.fadeOutSeconds)
        this.gainNode.gain.setValueAtTime(0, now + this.fadeOutSeconds)
        this.source.stop(now + this.fadeOutSeconds)
      } catch (e) {
        try {
          this.source.stop()
        } catch (_) {}
      }
      try {
        this.source.disconnect()
      } catch (_) {}
      this.source = null
    }

    this._paused = false
    this._played = false
    this.pausedAt = 0
    this.startedAt = 0
  }

  /**
   * 一時停止（現在の再生位置を記録し、短いフェードアウト後に停止）
   */
  pause(): void {
    if (!this.source || this._paused || !this._played) {
      return
    }

    // Calculate elapsed time
    const now = this.audioContext.currentTime
    this.pausedAt = now - this.startedAt

    // スムーズにフェードアウトしてから停止
    try {
      this.gainNode.gain.cancelScheduledValues(now)
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now)
      // Exponential ramps cannot target 0; ramp to epsilon then set 0
      this.gainNode.gain.exponentialRampToValueAtTime(this.minGain, now + this.fadeOutSeconds)
      this.gainNode.gain.setValueAtTime(0, now + this.fadeOutSeconds)
      if (this.source) this.source.stop(now + this.fadeOutSeconds)
    } catch (_) {
      try {
        if (this.source) this.source.stop()
      } catch (_) {}
    }
    if (this.source) {
      try {
        this.source.disconnect()
      } catch (_) {}
    }
    this.source = null

    this._paused = true

    if (this.onpause) {
      this.onpause()
    }
  }

  /**
   * 一時停止位置から再開
   */
  resume(): void {
    if (!this._paused || !this.audioBuffer) {
      return
    }

    // Create and start source from paused position
    this._createAndStartSourceNode(this.pausedAt)

    this._paused = false
    this.startedAt = this.audioContext.currentTime - this.pausedAt

    if (this.onplay) {
      this.onplay()
    }
  }

  /**
   * リソース解放
   */
  release(): void {
    this.stop()
    this.audioContext.close()
  }

  /**
   * パン（-1:左, 0:中央, 1:右）
   */
  get pan(): number {
    return this.pannerNode.pan.value
  }

  set pan(value: number) {
    this.pannerNode.pan.value = Math.max(-1, Math.min(1, value))
  }

  /**
   * ゲイン（音量 0〜1）
   */
  get gain(): number {
    return this.gainNode.gain.value
  }

  set gain(value: number) {
    const now = this.audioContext.currentTime
    this.targetGain = Math.max(0, Math.min(1, value))
    // 急激な音量変化を避けるため、短いランプで平滑化
    try {
      this.gainNode.gain.cancelScheduledValues(now)
      // Ensure start value > 0 for exponential ramp
      const start = Math.max(this.minGain, this.gainNode.gain.value)
      this.gainNode.gain.setValueAtTime(start, now)
      const target = this.targetGain > 0 ? this.targetGain : this.minGain
      this.gainNode.gain.exponentialRampToValueAtTime(target, now + 0.1)
      if (this.targetGain === 0) {
        // Snap to exact 0 at the end to fully mute
        this.gainNode.gain.setValueAtTime(0, now + 0.1)
      }
    } catch (_) {
      this.gainNode.gain.value = this.targetGain
    }
  }

  /**
   * 準備済みのバッファが存在するか
   */
  get hasBuffer(): boolean {
    return !!this.audioBuffer
  }

  /**
   * 準備済みバッファを破棄（自然終了や明示的な破棄時に使用）
   */
  clearPrepared(): void {
    this.audioBuffer = null
  }

  /**
   * 一時停止中か
   */
  get paused(): boolean {
    return this._paused
  }

  /**
   * 再生中/再生したことがあるか（自然終了までは true）
   */
  get played(): boolean {
    return this._played
  }

  /**
   * 指定オフセットから再生するための BufferSource を生成して開始
   */
  private _createAndStartSourceNode(offset: number): void {
    if (!this.audioBuffer) {
      return
    }

    // Create a new buffer source
    this.source = this.audioContext.createBufferSource()
    this.source.buffer = this.audioBuffer

    // Connect the source to the gain node
    this.source.connect(this.gainNode)

    // 再生終了時の処理
    this.source.onended = () => {
      // Only trigger onended if not manually stopped
      if (this._played && !this._paused) {
        this._played = false
        // Discard prepared buffer to avoid unintended replays
        this.clearPrepared()
        // Release source reference
        this.source = null
        if (this.onended) {
          this.onended()
        }
      }
    }

    // Start playback from offset
    const now = this.audioContext.currentTime
    // クリック回避のため、開始時はフェードイン
    try {
      this.gainNode.gain.cancelScheduledValues(now)
      // Exponential ramp requires positive start; begin from epsilon
      this.gainNode.gain.setValueAtTime(this.minGain, now)
      const target = this.targetGain > 0 ? this.targetGain : this.minGain
      this.gainNode.gain.exponentialRampToValueAtTime(target, now + this.fadeInSeconds)
      if (this.targetGain === 0) {
        this.gainNode.gain.setValueAtTime(0, now + this.fadeInSeconds)
      }
    } catch (_) {}
    this.source.start(now, offset)
  }
}
