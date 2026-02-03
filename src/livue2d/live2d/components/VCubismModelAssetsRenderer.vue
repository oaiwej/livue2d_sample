<template>
  <slot v-if="initialized"></slot>
</template>

<script setup lang="ts">
/**
 * @file VCubismModelAssetsProviderRenderer.vue
 * @brief モデルアセットのレンダリング処理を提供するコンポーネント
 * Live2Dモデルを実際に描画するための機能を実装しています
 */
import { logger } from '@/logger';
import { CubismMatrix44 } from '@framework/math/cubismmatrix44';
import { CubismModelMatrix } from '@framework/math/cubismmodelmatrix';
import { inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { safeInject } from '../utils/safeInject';
import type { ProvidedWebGLRenderingContext } from './VCubismCanvasWebGLProvider.vue';
import type { ProvidedCubismModelAssets } from './VCubismModelAssetsProvider.vue';
import type { ProvidedCubismModelMatrix } from './VCubismModelMatrixProvider.vue';
import type { ProvidedCubismProjectionMatrix } from './VCubismProjectionMatrixProvider.vue';
import type { ProvidedRegisterRenderFunction, ProvidedUnregisterRenderFunction } from './VCubismRenderLoopProvider.vue';
import type { ProvidedCubismViewMatrix } from './VCubismViewMatrixProvider.vue';

const props = withDefaults(defineProps<{
  zIndex?: number;
}>(), {
  zIndex: 0,
});

// コンポーネントの初期化状態を管理するリアクティブ変数
const initialized = ref(false);
// 親コンポーネントから提供されるWebGLコンテキストを取得
const gl = safeInject<ProvidedWebGLRenderingContext>('WebGLRenderingContext');
// 親コンポーネントから提供されるモデルアセット情報を取得
const assets = safeInject<ProvidedCubismModelAssets>('CubismModelAssets');
// レンダリング関数の登録用関数を親コンポーネントから取得
const registerRenderFunction = safeInject<ProvidedRegisterRenderFunction>('RegisterRenderFunction');
// レンダリング関数の登録解除用関数を親コンポーネントから取得
const unregisterRenderFunction = safeInject<ProvidedUnregisterRenderFunction>('UnregisterRenderFunction');
// モデル座標設定用の行列を親コンポーネントから取得
const modelMatrix = inject<ProvidedCubismModelMatrix>('CubismModelMatrix');
// ビュー座標設定用の行列を親コンポーネントから取得
const viewMatrix = inject<ProvidedCubismViewMatrix>('CubismViewMatrix');
// プロジェクション座標設定用の行列を親コンポーネントから取得
const projectionMatrix = inject<ProvidedCubismProjectionMatrix>('CubismProjectionMatrix');

/**
 * レンダリング関数
 * 実際にLive2Dモデルを描画するためのメイン処理
 * アニメーションフレームごとに呼び出される
 */
function render(): void {
  // WebGLコンテキストが取得できない場合はエラーを出力して終了
  if (!gl.value) {
    logger.error('WebGLコンテキストが見つかりません');
    return;
  }
  const canvas = gl.value.canvas;
  const { model, renderer } = assets.value;

  // モデルまたはレンダラが取得できない場合はエラーを出力して終了
  if (!model || !renderer) {
    logger.error('モデルまたはレンダラが見つかりません');
    return;
  }

  // プロジェクション行列を作成し、モデル行列と掛け合わせる
  const projection: CubismMatrix44 = projectionMatrix?.value.clone() ?? new CubismMatrix44();
  const defaultModelMatrix = new CubismModelMatrix(model.getCanvasWidth(), model.getCanvasHeight());
  const matrix = modelMatrix?.value ?? defaultModelMatrix;
  projection.multiplyByMatrix(matrix);
  if (viewMatrix?.value) {
    projection.multiplyByMatrix(viewMatrix.value);
  }
  renderer.setMvpMatrix(projection);

  // モデルの描画処理
  const viewport = [0, 0, canvas.width, canvas.height];
  renderer.setRenderState(gl.value.getParameter(gl.value.FRAMEBUFFER_BINDING), viewport);
  renderer.drawModel();
}

/**
 * コンポーネントマウント時の初期化処理
 * レンダリング関数を登録し、初期化状態をtrueに設定
 */
onMounted(() => {
  // アニメーションフレームごとに呼び出されるレンダリング関数を登録
  registerRenderFunction(render, props.zIndex);
  initialized.value = true;
});

/**
 * コンポーネントアンマウント時の終了処理
 * レンダリング関数の登録を解除し、初期化状態をfalseに設定
 */
onBeforeUnmount(() => {
  initialized.value = false;
  // レンダリング関数の登録を解除
  unregisterRenderFunction(render);
});

// zIndexプロパティの変更を監視し、レンダリング関数の登録を更新
watch(() => props.zIndex, (zIndex: number) => {
  unregisterRenderFunction(render);
  registerRenderFunction(render, zIndex);
});
</script>

<style scoped></style>
