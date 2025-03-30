<script setup lang="ts">
import VFileInput from '@/components/ui/VFileInput.vue';
import VProgress from '@/components/ui/VProgress.vue';
import VExpressionMapFormGroup from '@/components/VideoRenderView/VExpressionMapFormGroup.vue';
import VParagraphDefaultConfigFormGroup from '@/components/VideoRenderView/VParagraphDefaultConfigFormGroup.vue';
import VParagraphsEditor from '@/components/VideoRenderView/VParagraphsEditor.vue';
import VVideoDeltaTimeProvider, { type VideoDeltaTimeUpdateEvent } from '@/components/VideoRenderView/VVideoDeltaTimeProvider.vue';
import VVideoRecorder from '@/components/VideoRenderView/VVideoRecorder.vue';
import VVoicevoxLipsync from '@/components/VVoicevoxLipsync.vue';
import VCubismCanvasWebGLProvider from '@/live2d/components/VCubismCanvasWebGLProvider.vue';
import VCubismExpressionManager from '@/live2d/components/VCubismExpressionManager.vue';
import VCubismFramework from '@/live2d/components/VCubismFramework.vue';
import VCubismModelAssetsProvider from '@/live2d/components/VCubismModelAssetsProvider.vue';
import VCubismModelAssetsRenderer from '@/live2d/components/VCubismModelAssetsRenderer.vue';
import VCubismModelMatrixProvider from '@/live2d/components/VCubismModelMatrixProvider.vue';
import VCubismMotionManager from '@/live2d/components/VCubismMotionManager.vue';
import VCubismProjectionMatrixProvider from '@/live2d/components/VCubismProjectionMatrixProvider.vue';
import VCubismRenderLoopProvider from '@/live2d/components/VCubismRenderLoopProvider.vue';
import VCubismUpdateModel from '@/live2d/components/VCubismUpdateModel.vue';
import VCubismUpdateModelBreath from '@/live2d/components/VCubismUpdateModelBreath.vue';
import VCubismUpdateModelExpression from '@/live2d/components/VCubismUpdateModelExpression.vue';
import VCubismUpdateModelEyeBlink from '@/live2d/components/VCubismUpdateModelEyeBlink.vue';
import VCubismUpdateModelMotion from '@/live2d/components/VCubismUpdateModelMotion.vue';
import VCubismUpdateModelPhysics from '@/live2d/components/VCubismUpdateModelPhysics.vue';
import VCubismViewMatrixProvider from '@/live2d/components/VCubismViewMatrixProvider.vue';
import { logger } from '@/logger';
import { audioFromParagraphs, audioQueriesFromParagraph } from '@/utils/app/audioFromParagraphs';
import { paragraphsFromSrt } from '@/utils/app/paragraphsFromSrt';
import { paragraphToSrt } from '@/utils/app/paragraphToSrt';
import { paragraphToVtt } from '@/utils/app/paragraphToVtt';
import { selectExpression } from '@/utils/app/selectExpression';
import { DEFAULT_EXPRESSION_MAP, type ExpressionMap, type ExpressionMapValue } from '@/utils/app/type/ExpressionMap';
import { DEFAULT_PARAGRAPH, type Paragraph } from '@/utils/app/type/Paragraph';
import type { ViewSetting } from '@/utils/app/type/ViewSetting';
import { makeAudioEncoderConfig } from '@/utils/encoder/makeAudioEncoderConfig';
import { makeVideoEncoderConfig } from '@/utils/encoder/makeVideoEncoderConfig';
import { formatSrtTime } from '@/utils/subtitle/srt/formatSrtTime';
import { loadSrt } from '@/utils/subtitle/srt/loadSrt';
import { getDurationFromAudioQueries } from '@/utils/voicevox/getDurationFromAudioQuery';
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { ArrayBufferTarget, Muxer, SubtitleEncoder } from 'webm-muxer';

const waitMessage = ref('')
const state = ref<'LoadFile' | 'EditParagraphs' | 'Rendering' | 'Rendered'>('LoadFile')
const paragraphs = ref<Paragraph[]>([])
const padTime = 500 // ms

// デフォルトの段落設定
const defaultParagraph = ref<Paragraph>(DEFAULT_PARAGRAPH)
// Live2Dモデル
const modelName = ref<string>('Mao')
const modelHomeDir = computed<string>(() => `/Resources/${modelName.value}/`);
const modelFileName = computed<string>(() => `${modelName.value}.model3.json`);
// 表示設定
const viewSetting = ref<ViewSetting>({
  canvasWidth: 1024,
  canvasHeight: 1024,
  framerate: 30,
  scale: 3,
  translateX: 0,
  translateY: -0.9,
})
// 感情表現とモーション・表情のマッピング
const expressionMap = ref<ExpressionMap>({
  normal: {
    ...structuredClone(DEFAULT_EXPRESSION_MAP.normal),
    motionGroupName: 'Idle',
    motionIndex: 0,
    expressionIndex: 0,
  },
  happy: {
    ...structuredClone(DEFAULT_EXPRESSION_MAP.happy),
    motionGroupName: 'TapBody',
    motionIndex: 2,
    expressionIndex: 1,
  },
  sad: {
    ...structuredClone(DEFAULT_EXPRESSION_MAP.sad),
    motionGroupName: 'TapBody',
    motionIndex: 1,
    expressionIndex: 4,
  },
  angry: {
    ...structuredClone(DEFAULT_EXPRESSION_MAP.angry),
    motionGroupName: 'TapBody',
    motionIndex: 0,
    expressionIndex: 7,
  },
  surprised: {
    ...structuredClone(DEFAULT_EXPRESSION_MAP.surprised),
    motionGroupName: 'TapBody',
    motionIndex: 1,
    expressionIndex: 6,
  },
  blush: {
    ...structuredClone(DEFAULT_EXPRESSION_MAP.blush),
    motionGroupName: 'TapBody',
    motionIndex: 1,
    expressionIndex: 5,
  },
})
watch(modelName, () => {
  expressionMap.value = structuredClone(DEFAULT_EXPRESSION_MAP)
})

// .srtファイルの読み込み
const fileList = ref<FileList | null>(null)
async function onSubmitSrt() {
  const file = fileList.value?.[0]
  if (file) {
    // SRTファイルを読み込み
    waitMessage.value = 'SRTファイルを読み込み中...'
    const srt = await loadSrt(file)
    paragraphs.value = await paragraphsFromSrt(srt, defaultParagraph.value)
  }
  else {
    paragraphs.value = [{
      ...defaultParagraph.value,
    }]
  }
  state.value = 'EditParagraphs'
  waitMessage.value = ''
}

// モデルの読み込み
const isModelLoaded = ref(false)
function onAssetsLoaded() {
  isModelLoaded.value = true
  logger.info('モデルの読み込みが完了しました')
}

// レンダー中の時間位置
const currentTime = ref(0);
function onTimeUpdate(e: VideoDeltaTimeUpdateEvent) {
  currentTime.value = e.currentTime * 1_000
  if (currentTime.value >= paragraphs.value[paragraphs.value.length - 1].end) {
    state.value = 'Rendered'
    onRendered()
  }
}
// 現在時間位置の段落
const currentParagraph = computed<Paragraph | null>(() => {
  const time = currentTime.value
  return paragraphs.value.find(paragraph => paragraph.start <= time && time < paragraph.end) ?? null
})
// 現在時間位置の感情表現
const currentExpression = computed<ExpressionMapValue>(() => {
  const paragraph = currentParagraph.value
  if (!paragraph) {
    return expressionMap.value['normal']
  }
  if (paragraph.expressionType === 'auto') {
    return expressionMap.value['normal']
  }
  return expressionMap.value[paragraph.expressionType]
})

// 準備してレンダー開始
async function startRender() {
  waitMessage.value = '音声合成クエリを取得中...'
  for (const paragraph of paragraphs.value) {
    if (!paragraph.audioQueries?.length) {
      // 音声合成クエリを取得
      paragraph.audioQueries = await audioQueriesFromParagraph(paragraph)
    }

    // 段落の長さを取得
    const paragraphDuration = paragraph.end - paragraph.start
    // 音声合成クエリの長さを取得
    const audioDuration = getDurationFromAudioQueries(paragraph.audioQueries) * 1_000
    // 音声合成クエリの長さが段落の長さよりも長い場合は、スピードを上げる
    if (audioDuration > paragraphDuration - padTime) {
      // 500ms以上の余裕を持たせる
      const padDuration = paragraphDuration - padTime
      // スピードを上げる
      paragraph.speedScale = Math.max(paragraph.speedScale, paragraph.speedScale * audioDuration / padDuration)
      logger.info('スピードを調整', paragraph.speedScale, paragraph.text)
      paragraph.audioQueries = paragraph.audioQueries.map(audioQuery => {
        return {
          ...audioQuery,
          speedScale: paragraph.speedScale,
        }
      })
    }
  }
  waitMessage.value = '感情表現を自動選択中...'
  for (const paragraph of paragraphs.value) {
    if (paragraph.expressionType === 'auto') {
      // 自動で感情表現を選択
      paragraph.expressionType = await selectExpression(paragraph.text)
    }
  }
  // エンコーダーを初期化
  waitMessage.value = 'エンコーダーを初期化中...'
  await initEncoder()
  // レンダリング開始
  state.value = 'Rendering'
  waitMessage.value = ''
}

// Videoエンコーダー情報
const videoCodec = ref<Awaited<ReturnType<typeof makeVideoEncoderConfig>> | null>(null)
// Audioエンコーダー情報
const audioCodec = ref<Awaited<ReturnType<typeof makeAudioEncoderConfig>> | null>(null)
// マルチプレクサ
const muxer = shallowRef<Muxer<ArrayBufferTarget> | null>(null)
// ビデオエンコーダーの出力を受け取るバッファ
const videoBuffer = shallowRef<ArrayBufferTarget>(new ArrayBufferTarget())
// ビデオエンコーダーの初期化
async function initEncoder() {
  // サポートされているビデオコーデックを取得
  videoCodec.value = await makeVideoEncoderConfig({
    width: viewSetting.value.canvasWidth,
    height: viewSetting.value.canvasHeight,
    framerate: viewSetting.value.framerate,
    // alpha: 'keep',
    latencyMode: 'quality',
    bitrateMode: 'quantizer',
  })
  if (!videoCodec.value.codecInfo) {
    throw new Error('Failed to get video codec info')
  }
  if (!videoCodec.value.config) {
    throw new Error('Failed to get video encoder config')
  }
  // サポートされているオーディオコーデックを取得
  const audioQuery = paragraphs.value.find(paragraph => paragraph.audioQueries?.length)?.audioQueries?.[0]
  audioCodec.value = await makeAudioEncoderConfig({
    sampleRate: audioQuery?.outputSamplingRate ?? 24_000,
    numberOfChannels: audioQuery?.outputStereo ? 2 : 1,
  })
  if (!audioCodec.value?.codecInfo) {
    throw new Error('Failed to get audio codec info')
  }
  if (!audioCodec.value?.config) {
    throw new Error('Failed to get audio encoder config')
  }

  // マルチプレクサを初期化
  muxer.value = new Muxer({
    target: videoBuffer.value,
    type: 'matroska',
    video: {
      width: viewSetting.value.canvasWidth,
      height: viewSetting.value.canvasHeight,
      frameRate: viewSetting.value.framerate,
      codec: videoCodec.value.codecInfo.matroskaId,
      alpha: true,
    },
    audio: {
      codec: audioCodec.value.codecInfo.matroskaId,
      sampleRate: audioCodec.value.config.sampleRate,
      numberOfChannels: audioCodec.value.config.numberOfChannels,
    },
    // @ts-expect-error WebVTTのサポート
    subtitles: {
      codec: 'S_TEXT/WEBVTT'
    },
  })
}
// ビデオエンコーダーの出力を受け取る
function onVideoEncoderOutput(chunk: EncodedVideoChunk, metadata?: EncodedVideoChunkMetadata) {
  muxer.value?.addVideoChunk(chunk, metadata)
}
// ビデオとオーディオのURL
const videoUrl = ref<string | null>(null)
const audioUrl = ref<string | null>(null)
const srtUrl = ref<string | null>(null)
const vttUrl = ref<string | null>(null)
async function onRendered() {
  if (!muxer.value || !videoCodec.value?.codecInfo || !audioCodec.value?.codecInfo || !audioCodec.value?.config) {
    throw new Error('muxer or codec is not initialized')
  }
  // 字幕エンコーダーを初期化
  waitMessage.value = '字幕データをエンコード中...'
  const subtitleEncoder = new SubtitleEncoder({
    output(chunk, meta) {
      muxer.value?.addSubtitleChunk(chunk, meta)
    },
    error(e) {
      console.error('SubtitleEncoder error', e)
    }
  })
  subtitleEncoder.configure({
    codec: 'webvtt'
  });
  // 字幕データをエンコード
  const vttText = paragraphToVtt(paragraphs.value)
  subtitleEncoder.encode(vttText)

  // オーディオエンコーダーを初期化
  const audioEncoder = new AudioEncoder({
    output(chunk, metadata) {
      muxer.value?.addAudioChunk(chunk, metadata)
    },
    error(e) {
      console.error('AudioEncoder error', e)
    }
  })
  audioEncoder.configure(audioCodec.value.config)

  // 音声データを取得
  waitMessage.value = '音声データを取得中...'
  const wav = await audioFromParagraphs(paragraphs.value)
  const audioData = new AudioData({
    data: wav.getBody(),
    format: wav.getFormat().bitsPerSample === 16 ? 's16' : 'u8',
    numberOfChannels: wav.getFormat().channels,
    numberOfFrames: wav.getNumSamples(),
    sampleRate: wav.getFormat().sampleRate,
    timestamp: 0,
  })

  // 音声データをエンコード
  waitMessage.value = '音声データをエンコード中...'
  audioEncoder.encode(audioData)
  await audioEncoder.flush()
  audioEncoder.close()

  // マルチプレクサを終了
  muxer.value?.finalize()

  // ビデオとオーディオのURLを作成
  const buffer = muxer.value.target.buffer
  const blob = new Blob([buffer], { type: `video/x-matroska; codecs="${videoCodec.value.codecInfo.codec},${audioCodec.value.codecInfo.codec}"` })
  videoUrl.value = URL.createObjectURL(blob)

  const audioBlob = new Blob([wav.getBuffer()], { type: 'audio/wav' })
  audioUrl.value = URL.createObjectURL(audioBlob)

  // 字幕のURLを作成
  const vttBlob = new Blob([vttText], { type: 'text/vtt' })
  vttUrl.value = URL.createObjectURL(vttBlob)
  // SRTのURLを作成
  const srtText = paragraphToSrt(paragraphs.value)
  const srtBlob = new Blob([srtText], { type: 'application/x-subrip' })
  srtUrl.value = URL.createObjectURL(srtBlob)

  // レンダリング完了
  waitMessage.value = ''
}
// リソースを解放
onBeforeUnmount(() => {
  if (videoUrl.value) {
    URL.revokeObjectURL(videoUrl.value)
  }
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
  }
  if (srtUrl.value) {
    URL.revokeObjectURL(srtUrl.value)
  }
  if (vttUrl.value) {
    URL.revokeObjectURL(vttUrl.value)
  }
})
</script>

<template>
  <section class="flex flex-col h-[calc(100vh-10rem)] min-h-64 overflow-hidden w-full relative">
    <header class="pb-4 px-2">
      <h2 class="py-4">Live2Dモデルの会話レンダー</h2>
      <p>
        Live2Dモデルを使用して、音声合成とリップシンクを行いながら、会話をレンダリングします。
      </p>
    </header>
    <div v-if="waitMessage"
      class="absolute w-full h-full bg-theme-300/70 dark:bg-theme-700/70 transition-colors flex flex-col items-center justify-center gap-4 z-50 cursor-not-allowed">
      <!-- 処理中のメッセージ -->
      <div class="text-lg font-bold">{{ waitMessage }}</div>
      <div>しばらくお待ちください...</div>
    </div>
    <!-- Srtファイルの読み込み、またはスキップ -->
    <div v-if="state === 'LoadFile'" class="flex flex-col flex-1 gap-4 px-2 overflow-y-auto">
      <div class="flex flex-col">
        <label>.srt ファイルを読み込む？</label>
        <VFileInput v-model:file-list="fileList" accept=".srt" class="primary" />
      </div>
      <!-- 話者と速度の設定 -->
      <VParagraphDefaultConfigFormGroup v-model="defaultParagraph" class="flex flex-row gap-2" />
      <!-- 感情表現の設定 -->
      <VExpressionMapFormGroup v-model:model="modelName" v-model:view-setting="viewSetting"
        v-model:expression-map="expressionMap" />
      <div class="flex flex-col gap-2">
        <button type="submit" class="primary" @click="onSubmitSrt">Next</button>
      </div>
    </div>

    <!-- Paragraphsの入力欄 -->
    <div v-if="state === 'EditParagraphs'" class="flex flex-col flex-1 gap-2 overflow-hidden">
      <VParagraphsEditor v-model="paragraphs" :pad-time="padTime" class="flex-1" />
      <div class="flex flex-row gap-2">
        <button type="button" class="flex-1" @click="state = 'LoadFile'">Back</button>
        <button type="submit" class="flex-1 primary" @click="startRender">Next</button>
      </div>
    </div>

    <!-- レンダリング中 -->
    <div v-if="state === 'Rendering'" class="flex-1 flex flex-row gap-4 overflow-hidden">
      <div class="rounded-lg overflow-hidden relative flex-1">
        <!-- フレームワーク初期化 -->
        <VCubismFramework>
          <!-- WebGL描画用のCanvasをマウントし、WebGLコンテキストを提供 -->
          <VCubismCanvasWebGLProvider class="w-full aspect-square" :width="viewSetting.canvasWidth"
            :height="viewSetting.canvasHeight">
            <!-- プロジェクション行列を提供 -->
            <VCubismProjectionMatrixProvider>
              <!-- ViewMatrixを提供 -->
              <VCubismViewMatrixProvider>
                <!-- 描画ループを提供 -->
                <VCubismRenderLoopProvider :fps="isModelLoaded ? 1000 : 1">
                  <VVideoDeltaTimeProvider :fps="viewSetting.framerate" @timeupdate="onTimeUpdate">
                    <VVideoRecorder v-if="videoCodec?.config && isModelLoaded" :config="videoCodec.config"
                      @video-encoder-output="onVideoEncoderOutput" :qp="8">
                    </VVideoRecorder>
                    <!-- モデルアセットを読み込み提供 -->
                    <VCubismModelAssetsProvider :model-home-dir="modelHomeDir" :model-file-name="modelFileName"
                      @loaded="onAssetsLoaded">
                      <!-- モデルの更新処理 -->
                      <VCubismUpdateModel>
                        <!-- モーションの更新処理 -->
                        <VCubismUpdateModelMotion>
                          <!-- まばたきの更新処理 -->
                          <VCubismUpdateModelEyeBlink />
                        </VCubismUpdateModelMotion>
                        <!-- 呼吸の更新処理 -->
                        <VCubismUpdateModelBreath />
                        <!-- 物理演算の更新処理 -->
                        <VCubismUpdateModelPhysics />
                        <!-- 表情の更新処理 -->
                        <VCubismUpdateModelExpression />
                        <!-- 音声合成とリップシンク -->
                        <VVoicevoxLipsync v-if="currentParagraph?.audioQueries?.length"
                          :audio-queries="currentParagraph.audioQueries" />
                      </VCubismUpdateModel>
                      <!-- モデル座標設定用の行列を提供 -->
                      <VCubismModelMatrixProvider :scale-x="3" :scale-y="3" :translate-x="0" :translate-y="-0.9">
                        <!-- モデルのレンダー処理 -->
                        <VCubismModelAssetsRenderer />
                      </VCubismModelMatrixProvider>
                      <!-- モーションを管理するコンポーネント -->
                      <VCubismMotionManager :group="currentExpression.motionGroupName"
                        :index="currentExpression.motionIndex" />
                      <!-- 表情を管理するコンポーネント -->
                      <VCubismExpressionManager :index="currentExpression.expressionIndex" />
                    </VCubismModelAssetsProvider>
                  </VVideoDeltaTimeProvider>
                </VCubismRenderLoopProvider>
              </VCubismViewMatrixProvider>
            </VCubismProjectionMatrixProvider>
          </VCubismCanvasWebGLProvider>
        </VCubismFramework>
      </div>
      <div class="flex-1 flex flex-col gap-2 p-2 rounded-xl">
        <div>レンダー中: {{ formatSrtTime(currentTime) }} / {{ formatSrtTime(paragraphs[paragraphs.length - 1].end) }}
        </div>
        <VProgress :percentage="currentTime / (paragraphs[paragraphs.length - 1].end)" class="w-full primary" />
        <div
          class="flex-1 flex flex-col-reverse gap-6 px-4 py-2 overflow-y-auto bg-theme-300 dark:bg-theme-900 text-sm">
          <div v-for="paragraph in [...paragraphs.filter(paragraph => paragraph.start <= currentTime)].reverse()"
            :key="paragraph.id" class="whitespace-pre-wrap">
            <div class="flex flex-col w-full">
              <div>{{ formatSrtTime(paragraph.start) }} --&gt; {{ formatSrtTime(paragraph.end) }}</div>
              <div>{{ paragraph.text }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- レンダリング完了 -->
    <div v-if="state === 'Rendered'" class="flex-1 flex flex-col gap-2 px-2 pb-2 overflow-hidden">
      <video v-if="videoUrl" :src="videoUrl" controls class="rounded-lg overflow-hidden flex-1">
        <source :src="videoUrl" type="video/x-matroska" />
        <track v-if="vttUrl" :src="vttUrl" kind="subtitles" srclang="ja" label="Japanese" />
        <p>お使いのブラウザはvideoタグに対応していません。</p>
      </video>
      <div class="flex flex-row gap-2">
        <button type="button" @click="state = 'LoadFile'">Back</button>
        <div class="flex-1"></div>
        <span>Download:</span>
        <a v-if="videoUrl" :href="videoUrl" download class="px-2">Video</a>
        <a v-if="audioUrl" :href="audioUrl" download class="px-2">Audio</a>
        <a v-if="srtUrl" :href="srtUrl" download class="px-2">SRT</a>
        <a v-if="vttUrl" :href="vttUrl" download class="px-2">VTT</a>
      </div>
    </div>
  </section>
</template>

<style scoped></style>
