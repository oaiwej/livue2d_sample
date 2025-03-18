<template>
  <slot v-if="initialized"></slot>
</template>

<script setup lang="ts">
import { CubismViewMatrix } from '@framework/math/cubismviewmatrix';
import { onBeforeUnmount, onMounted, provide, ref, shallowRef, watch, type Ref } from 'vue';
import { safeInject } from '../utils/safeInject';
import type { ProvidedWebGLRenderingContext } from './VCubismCanvasWebGLProvider.vue';

const props = withDefaults(defineProps<{
  scaleX?: number;
  scaleY?: number;
}>(), {
  scaleX: 1,
  scaleY: 1,
});

// モデルの初期化状態を管理するリアクティブな変数
const initialized = ref(false);
// モデル座標設定用の行列
const viewMatrix = shallowRef<CubismViewMatrix>(new CubismViewMatrix());

// 親コンポーネントからWebGL描画コンテキストを注入
const gl = safeInject<ProvidedWebGLRenderingContext>('WebGLRenderingContext');

// Live2Dモデルの
export type ProvidedCubismViewMatrix = Ref<CubismViewMatrix>;
provide<ProvidedCubismViewMatrix>('CubismViewMatrix', viewMatrix);

function updateViewMatrix() {
  if (!gl.value) {
    return;
  }

  const canvas = gl.value.canvas as HTMLCanvasElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const ratio = width / height;
  const left = -ratio;
  const right = ratio;
  const bottom = -1.0;
  const top = 1.0;

  viewMatrix.value = new CubismViewMatrix();
  viewMatrix.value.setScreenRect(left, right, bottom, top);
  viewMatrix.value.scale(props.scaleX, props.scaleY);
}

// コンポーネントがDOMにマウントされたときの処理
onMounted(() => {
  // 初期化完了フラグを設定
  initialized.value = true;
  updateViewMatrix();
});

// コンポーネントがDOMからアンマウントされるときの処理
onBeforeUnmount(() => {
  // 初期化状態を未初期化に戻す
  initialized.value = false;
});

// コンポーネントが更新されたときの処理
watch(props, updateViewMatrix);
</script>
