<template>
  <slot v-if="initialized"></slot>
</template>

<script setup lang="ts">
/**
 * @file VCubismAnimationLoopProvider.vue
 * @brief Live2Dモデルのアニメーションループを提供するコンポーネント
 *     - モデルの更新処理を行う
 */
import { logger } from '@/logger';
import { onBeforeUnmount, onMounted, provide, ref } from 'vue';
import { safeInject } from '../utils/safeInject';
import type { ProvidedWebGLProgram, ProvidedWebGLRenderingContext } from './VCubismCanvasWebGLProvider.vue';
export type UpdateFunction = (deltaTime: number) => void | Promise<void>;
export type RenderFunction = (deltaTime: number) => void | Promise<void>;
export type PostRenderFunction = (deltaTime: number) => void | Promise<void>;

const props = withDefaults(defineProps<{
  fps?: number;
}>(), {
  fps: 30,
});

const initialized = ref(false);
const timeoutId = ref<ReturnType<typeof setTimeout> | null>(null);
const previouseTime = ref<number>(Date.now());
const updateFunctions = ref<UpdateFunction[]>([]);
const renderFunctions = ref<{ render: RenderFunction, zIndex: number }[]>([]);
const postRenderFunctions = ref<PostRenderFunction[]>([]);
export type CubismUpdateEvent = { deltaTime: number };
export type CubismRenderEvent = { gl: WebGLRenderingContext, programId: WebGLProgram };
const emit = defineEmits<{
  (event: 'updating', e: CubismUpdateEvent): void;
  (event: 'updated', e: CubismUpdateEvent): void;
  (event: 'rendering', e: CubismRenderEvent): void;
  (event: 'rendered', e: CubismRenderEvent): void;
}>();

// WebGLコンテキストを親コンポーネントから取得
const gl = safeInject<ProvidedWebGLRenderingContext>('WebGLRenderingContext');
// WebGLProgramを親コンポーネントから取得
const programId = safeInject<ProvidedWebGLProgram>('WebGLProgram');

//----------------------------------------------------------------------
// 更新関数を登録するための関数を提供
const cubismModelUpdateFunctions = ref<UpdateFunction[]>([]);
export type ProvidedRegisterUpdateFunction = (updateFunc: UpdateFunction) => void;
provide<ProvidedRegisterUpdateFunction>('RegisterUpdateFunction', (updateFunc: UpdateFunction) => {
  updateFunctions.value.push(updateFunc);
});

// 更新関数を登録解除するための関数を提供
export type ProvidedUnregisterUpdateFunction = (updateFunc: UpdateFunction) => void;
provide<ProvidedUnregisterUpdateFunction>('UnregisterUpdateFunction', (updateFunc: UpdateFunction) => {
  const index = cubismModelUpdateFunctions.value.indexOf(updateFunc);
  if (index >= 0) {
    updateFunctions.value.splice(index, 1);
  }
});

//----------------------------------------------------------------------
// レンダリング関数を登録するための関数を提供
export type ProvidedRegisterRenderFunction = (renderFunc: RenderFunction, zIndex?: number) => void;
provide<ProvidedRegisterRenderFunction>('RegisterRenderFunction', (renderFunc: RenderFunction, zIndex: number = 0) => {
  renderFunctions.value.push({ render: renderFunc, zIndex });
  renderFunctions.value.sort((a, b) => a.zIndex - b.zIndex); // z-indexでソート
});

// レンダリング関数を登録解除するための関数を提供
export type ProvidedUnregisterRenderFunction = (renderFunc: RenderFunction) => void;
provide<ProvidedUnregisterRenderFunction>('UnregisterRenderFunction', (renderFunc: RenderFunction) => {
  renderFunctions.value = renderFunctions.value.filter(func => func.render !== renderFunc);
});

//----------------------------------------------------------------------
// レンダリング後の関数を登録するための関数を提供
export type ProvidedRegisterPostRenderFunction = (renderFunc: PostRenderFunction) => void;
provide<ProvidedRegisterPostRenderFunction>('RegisterPostRenderFunction', (renderFunc: PostRenderFunction) => {
  postRenderFunctions.value.push(renderFunc);
});

// レンダリング後の関数を登録解除するための関数を提供
export type ProvidedUnregisterPostRenderFunction = (renderFunc: PostRenderFunction) => void;
provide<ProvidedUnregisterPostRenderFunction>('UnregisterPostRenderFunction', (renderFunc: PostRenderFunction) => {
  postRenderFunctions.value = postRenderFunctions.value.filter(func => func !== renderFunc);
});

//----------------------------------------------------------------------


/**
 * 登録されたすべての更新関数を実行する
 */
async function update() {
  if (!initialized.value) {
    return;
  }
  if (!gl.value) {
    logger.error('WebGLRenderingContext is not found');
    return;
  }
  if (!programId.value) {
    logger.error('WebGLProgram is not found');
    return;
  }
  const currentTime = Date.now();
  const deltaTime = (currentTime - previouseTime.value) / 1000.0;
  emit('updating', { deltaTime }); // 更新イベントを発火
  await updateFunctions.value.reduce((prev, current) => {
    return prev.then(() => current(deltaTime));
  }, Promise.resolve());
  previouseTime.value = currentTime;
  emit('updated', { deltaTime }); // 更新イベントを発火

  if (!initialized.value) return;

  // 画面の初期化
  gl.value.clearColor(0.0, 0.0, 0.0, 1.0);

  // 深度テストを有効化
  gl.value.enable(gl.value.DEPTH_TEST);

  // 近くにある物体は、遠くにある物体を覆い隠す
  gl.value.depthFunc(gl.value.LEQUAL);

  // カラーバッファや深度バッファをクリアする
  gl.value.clear(gl.value.COLOR_BUFFER_BIT | gl.value.DEPTH_BUFFER_BIT);
  gl.value.clearDepth(1.0);

  // 透過設定
  gl.value.enable(gl.value.BLEND);
  gl.value.blendFunc(gl.value.SRC_ALPHA, gl.value.ONE_MINUS_SRC_ALPHA);

  // シェーダープログラムを使用
  gl.value.useProgram(programId.value);
  gl.value.flush();

  // レンダリングイベントを発火
  emit('rendering', { gl: gl.value, programId: programId.value });

  // 登録されたすべてのレンダリング関数を実行する
  await renderFunctions.value.reduce((prev, current) => {
    return prev.then(() => current.render(deltaTime));
  }, Promise.resolve());

  // レンダリングイベントを発火
  emit('rendered', { gl: gl.value, programId: programId.value });

  if (!initialized.value) return;

  // 登録されたすべてのレンダリング後の関数を実行する
  await postRenderFunctions.value.reduce((prev, current) => {
    return prev.then(() => current(deltaTime));
  }, Promise.resolve());

}

// 更新関数の終了を待機するためのPromise
const updatePromise = ref<Promise<void>>(Promise.resolve());
async function wrapUpdate() {
  // 破棄処理用にPromiseを保持
  updatePromise.value = update();
  updatePromise.value.finally(() => {
    // 次のフレームをスケジュール
    if (initialized.value) {
      timeoutId.value = setTimeout(wrapUpdate, 1000 / props.fps);
    }
  });
  return updatePromise.value;
}

// WebGLコンテキストとプログラムの初期化
onMounted(() => {
  timeoutId.value = setTimeout(wrapUpdate, 1000 / props.fps);
  initialized.value = true;
});

// コンポーネントがアンマウントされたときの処理
onBeforeUnmount(async () => {
  initialized.value = false;
  if (timeoutId.value) {
    clearTimeout(timeoutId.value);
  }
});
</script>

<style scoped></style>
