<template>
  <slot v-if="initialized"></slot>
</template>

<script setup lang="ts">
/**
 * @file VVideoRecorder.vue
 * @brief <canvas>の内容を動画にエンコードするコンポーネント
 */
import type { ProvidedWebGLRenderingContext } from '@/live2d/components/VCubismCanvasWebGLProvider.vue';
import type { ProvidedRegisterPostRenderFunction, ProvidedUnregisterPostRenderFunction } from '@/live2d/components/VCubismRenderLoopProvider.vue';
import { safeInject } from '@/live2d/utils/safeInject';
import { logger } from '@/logger';
import { onBeforeUnmount, onMounted, ref, shallowRef, toRaw, watch } from 'vue';

const props = withDefaults(defineProps<{
  config: VideoEncoderConfig;
  qp?: number;
}>(), {
  qp: 1,
});

const initialized = ref(false);
const emit = defineEmits<{
  (event: 'videoEncoderOutput', chunk: EncodedVideoChunk, metadata?: EncodedVideoChunkMetadata): void;
  (event: 'encoderConfigChanged', config: VideoEncoderConfig): void;
}>();

// WebGLコンテキストを親コンポーネントから取得
const gl = safeInject<ProvidedWebGLRenderingContext>('WebGLRenderingContext');
//
const registerPostRenderFunction = safeInject<ProvidedRegisterPostRenderFunction>('RegisterPostRenderFunction');
const unregisterPostRenderFunction = safeInject<ProvidedUnregisterPostRenderFunction>('UnregisterPostRenderFunction');

// エンコーダー
const videoEncoder = shallowRef<VideoEncoder | null>(null);
// エンコードオプション
const encodeOptions = shallowRef<VideoEncoderEncodeOptions>({});
// タイムスタンプ
const timestamp = ref(0);

/**
 * フレームをエンコードする
 */
async function encodeFrame(deltaTime: number) {
  if (!initialized.value) {
    return;
  }
  if (!gl.value) {
    logger.error('WebGLRenderingContext is not found');
    return;
  }
  if (!videoEncoder.value) {
    logger.error('VideoEncoder is not found');
    return;
  }

  // フレームをエンコーダーに渡す
  const frame = new VideoFrame(gl.value.canvas as HTMLCanvasElement, { timestamp: timestamp.value });
  try {
    videoEncoder.value.encode(frame, toRaw(encodeOptions.value));
  }
  finally {
    frame.close();
  }
  // キューが積み上がっている場合は、フラッシュする
  if (videoEncoder.value.encodeQueueSize > (props.config.framerate ?? 30)) {
    await videoEncoder.value.flush();
  }

  // マイクロ秒単位のタイムスタンプを更新
  timestamp.value += deltaTime * 1_000_000;
}

// WebGLコンテキストとプログラムの初期化
onMounted(() => {
  if (!gl.value) {
    logger.error('WebGLRenderingContext is not found');
    return;
  }

  // エンコーダーの初期化
  const encoder = new VideoEncoder({
    output(chunk, metadata) {
      if (initialized.value) {
        emit('videoEncoderOutput', chunk, metadata);
      }
    },
    error(e) {
      logger.error('VideoEncoder error', e);
    },
  })
  encoder.configure({ ...props.config });
  videoEncoder.value = encoder;

  // エンコードオプションの初期化
  const qp = props.qp;
  encodeOptions.value.avc = { quantizer: qp };
  if (props.config.codec.match(/^av01/)) {
    // @ts-expect-error av1の設定
    encodeOptions.value.av1 = { quantizer: qp };
  }
  else if (props.config.codec.match(/^hvc1/)) {
    // @ts-expect-error hevcの設定
    encodeOptions.value.hevc = { quantizer: qp };
  }
  else if (props.config.codec.match(/^vp09/)) {
    // @ts-expect-error vp9の設定
    encodeOptions.value.vp9 = { quantizer: qp };
  }

  // タイムスタンプの初期化
  timestamp.value = 0;

  // レンダリング後関数を登録
  registerPostRenderFunction(encodeFrame);

  // 初期化完了
  initialized.value = true;
});

// コンポーネントがアンマウントされたときの処理
onBeforeUnmount(async () => {
  initialized.value = false;

  // レンダリング後関数を解除
  unregisterPostRenderFunction(encodeFrame);

  // エンコーダーをクローズ
  if (videoEncoder.value) {
    logger.info('Closing VideoEncoder');
    await videoEncoder.value.flush();
    videoEncoder.value.close();
  }
  // エンコーダーを破棄
  videoEncoder.value = null;
});


// エンコーダ設定の変更を監視
watch(() => ({ ...props.config }), (config) => {
  if (!videoEncoder.value) {
    return;
  }
  // エンコーダーの設定を変更
  videoEncoder.value.reset();
  videoEncoder.value.configure({ ...config });
  // タイムスタンプをリセット
  timestamp.value = 0;
  // エンコーダーの設定変更を通知
  emit('encoderConfigChanged', config);
});
</script>

<style scoped></style>
