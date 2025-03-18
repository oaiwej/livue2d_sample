<template>
  <canvas ref="canvas">
    <slot v-if="initialized"></slot>
  </canvas>
</template>

<script setup lang="ts">
/**
 * @file VCubismCanvasProvider.vue
 * @brief WebGL2のCanvasを提供するコンポーネント
 *     - WebGLのコンテキストの管理
 *     - 更新処理の管理
 *     - レンダリング処理の管理
 *     - 一定時間ごとに更新処理とレンダリング処理を実行
 */
import { createShader } from '@/live2d/webgl/createShader';
import { logger } from '@/logger';
import { onBeforeUnmount, onMounted, onUnmounted, provide, ref, shallowRef, type Ref } from 'vue';
export type UpdateFunction = (deltaTime: number) => void;
export type RenderFunction = () => void

const initialized = ref(false);
const canvas = shallowRef<HTMLCanvasElement | null>(null);
const glContext = shallowRef<WebGLRenderingContext | null>(null);
const programId = shallowRef<WebGLProgram | null>(null);
const intervalId = ref<ReturnType<typeof setInterval> | null>(null);

// WebGLコンテキストを提供
export type ProvidedWebGLRenderingContext = Ref<WebGLRenderingContext | null>;
provide<ProvidedWebGLRenderingContext>('WebGLRenderingContext', glContext);

// WebGLProgramを提供
export type ProvidedWebGLProgram = Ref<WebGLProgram | null>;
provide<ProvidedWebGLProgram>('WebGLProgram', programId);

// WebGLコンテキストとプログラムの初期化
onMounted(() => {
  if (!canvas.value) {
    logger.error('Canvas element is not found');
    return;
  }
  glContext.value = canvas.value.getContext('webgl2');
  if (!glContext.value) {
    logger.error('Failed to get WebGL2 context');
    return;
  }
  programId.value = createShader(glContext.value);
  initialized.value = true;
});

// コンポーネントがアンマウントされるときの処理
onBeforeUnmount(() => {
  initialized.value = false;
  if (intervalId.value) {
    clearInterval(intervalId.value);
  }
});

// コンポーネントがアンマウントされたときの処理
onUnmounted(() => {
  glContext.value?.deleteProgram(programId.value);
  glContext.value = null;
});
</script>

<style scoped></style>
