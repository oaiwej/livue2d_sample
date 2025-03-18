<template>
  <slot v-if="initialized"></slot>
</template>

<script setup lang="ts">
import { CubismModelMatrix } from '@framework/math/cubismmodelmatrix';
import { onBeforeUnmount, onMounted, provide, ref, shallowRef, watch, type Ref } from 'vue';
import { safeInject } from '../utils/safeInject';
import type { ProvidedCubismModelAssets } from './VCubismModelAssetsProvider.vue';

const props = withDefaults(defineProps<{
  centerX?: number;
  centerY?: number;
  translateX?: number;
  translateY?: number;
  scaleX?: number;
  scaleY?: number;
}>(), {
  centerX: 0,
  centerY: 0,
  translateX: 0,
  translateY: 0,
  scaleX: 1,
  scaleY: 1,
});

// モデルの初期化状態を管理するリアクティブな変数
const initialized = ref(false);
// モデル座標設定用の行列
const modelMatrix = shallowRef<CubismModelMatrix>(new CubismModelMatrix());

// 親コンポーネントからLive2Dモデルのアセット情報を注入
const assets = safeInject<ProvidedCubismModelAssets>('CubismModelAssets');

// Live2Dモデルの
export type ProvidedCubismModelMatrix = Ref<CubismModelMatrix>;
provide<ProvidedCubismModelMatrix>('CubismModelMatrix', modelMatrix);

function updateModelMatrix() {
  const { model } = assets.value;
  if (!model) {
    return;
  }

  modelMatrix.value = new CubismModelMatrix(model.getCanvasWidth(), model.getCanvasHeight());
  if (props.centerX !== undefined) {
    modelMatrix.value.centerX(props.centerX);
  }
  if (props.centerY !== undefined) {
    modelMatrix.value.centerY(props.centerY);
  }
  if (props.translateX !== undefined) {
    modelMatrix.value.translateX(props.translateX);
  }
  if (props.translateY !== undefined) {
    modelMatrix.value.translateY(props.translateY);
  }
  if (props.scaleX !== undefined || props.scaleY !== undefined) {
    modelMatrix.value.scale(props.scaleX ?? 1, props.scaleY ?? 1);
  }
}

// コンポーネントがDOMにマウントされたときの処理
onMounted(() => {
  // 初期化完了フラグを設定
  initialized.value = true;
  updateModelMatrix();
});

// コンポーネントがDOMからアンマウントされるときの処理
onBeforeUnmount(() => {
  // 初期化状態を未初期化に戻す
  initialized.value = false;
});

// コンポーネントが更新されたときの処理
watch(() => assets.value.model, updateModelMatrix);
watch(props, updateModelMatrix);
</script>
