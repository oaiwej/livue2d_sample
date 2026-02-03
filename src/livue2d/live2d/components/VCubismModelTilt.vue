<template>
  <slot v-if="initialized"></slot>
</template>

<script setup lang="ts">
import { logger } from '@/livue2d/logger';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { safeInject } from '../utils/safeInject';
import type { ProvidedCubismModelAssets } from './VCubismModelAssetsProvider.vue';

// 初期化状態管理用の変数
const initialized = ref(false);

// プロパティ定義
const props = withDefaults(defineProps<{
  dragX: number; // ドラッグのX座標
  dragY: number; // ドラッグのY座標
}>(), {
  dragX: 0,
  dragY: 0,
});

// CubismModelAssets関数の注入
const assets = safeInject<ProvidedCubismModelAssets>('CubismModelAssets');

/**
 * モデルの視線・顔・姿勢を更新する
 */
function updateModelTilt() {
  if (!initialized.value) {
    return;
  }

  const { model } = assets.value;

  if (!model) {
    logger.error('Model is not found');
    return;
  }

  // ドラッグによる顔の向きの調整
  model.addParameterValueById('ParamAngleX', props.dragX * 30); // -30から30の値を加える
  model.addParameterValueById('ParamAngleY', props.dragY * 30);
  model.addParameterValueById('ParamAngleZ', props.dragX * props.dragY * -30);

  // ドラッグによる体の向きの調整
  model.addParameterValueById('ParamBodyAngleX', props.dragX * 10); // -10から10の値を加える

  // ドラッグによる目の向きの調整
  model.addParameterValueById('ParamEyeBallX', props.dragX); // -1から1の値を加える
  model.addParameterValueById('ParamEyeBallY', props.dragY);
}

// プロパティが変更された時にモデルを更新
watch(() => [props.dragX, props.dragY], () => {
  updateModelTilt();
});

// コンポーネントがマウントされた時の処理
onMounted(() => {
  initialized.value = true;
  updateModelTilt();
});

// コンポーネントがアンマウントされた時の処理
onBeforeUnmount(() => {
  initialized.value = false;
});
</script>

<style scoped></style>