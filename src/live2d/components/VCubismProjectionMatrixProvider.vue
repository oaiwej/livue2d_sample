<template>
  <slot v-if="initialized"></slot>
</template>

<script setup lang="ts">
import { CubismMatrix44 } from '@framework/math/cubismmatrix44';
import { onBeforeUnmount, onMounted, provide, ref, shallowRef, watch, type Ref } from 'vue';
import { safeInject } from '../utils/safeInject';
import type { ProvidedWebGLRenderingContext } from './VCubismCanvasWebGLProvider.vue';

// モデルの初期化状態を管理するリアクティブな変数
const initialized = ref(false);
// モデル座標設定用の行列
const projectionMatrix = shallowRef<CubismMatrix44>(new CubismMatrix44());

// 親コンポーネントからWebGL描画コンテキストを注入
const gl = safeInject<ProvidedWebGLRenderingContext>('WebGLRenderingContext');

// Live2Dモデルの
export type ProvidedCubismProjectionMatrix = Ref<CubismMatrix44>;
provide<ProvidedCubismProjectionMatrix>('CubismProjectionMatrix', projectionMatrix);

function updateProjectionMatrix() {
  if (!gl.value) {
    return;
  }

  const canvas = gl.value.canvas as HTMLCanvasElement;
  const width = canvas.width;
  const height = canvas.height;

  projectionMatrix.value = new CubismMatrix44();
  projectionMatrix.value.scale(height / width, 1.0);
}

// コンポーネントがDOMにマウントされたときの処理
onMounted(() => {
  // 初期化完了フラグを設定
  initialized.value = true;
  updateProjectionMatrix();
});

// コンポーネントがDOMからアンマウントされるときの処理
onBeforeUnmount(() => {
  // 初期化状態を未初期化に戻す
  initialized.value = false;
});

// コンポーネントが更新されたときの処理
watch(() => [gl.value?.canvas.width, gl.value?.canvas.height], () => {
  updateProjectionMatrix();
});
</script>
