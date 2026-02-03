<template>
  <slot v-if="initialized"></slot>
</template>

<script setup lang="ts">
import { logger } from '@/logger';
import { onBeforeUnmount, onMounted, provide, ref } from 'vue';
import { safeInject } from '../utils/safeInject';
import type { ProvidedCubismModelAssets } from './VCubismModelAssetsProvider.vue';
import type { ProvidedRegisterUpdateFunction, ProvidedUnregisterUpdateFunction, UpdateFunction } from './VCubismRenderLoopProvider.vue';

// モデルの初期化状態を管理するリアクティブな変数
const initialized = ref(false);

// 親コンポーネントからLive2Dモデルのアセット情報を注入
const assets = safeInject<ProvidedCubismModelAssets>('CubismModelAssets');

// Live2Dモデルの更新関数を登録するための関数を親コンポーネントから注入
const registerUpdateFunction = safeInject<ProvidedRegisterUpdateFunction>('RegisterUpdateFunction');

// 登録した更新関数を解除するための関数を親コンポーネントから注入
const unregisterUpdateFunction = safeInject<ProvidedUnregisterUpdateFunction>('UnregisterUpdateFunction');

// 子孫コンポーネントに提供する
// - RegisterUpdateFunction
// - UnregisterUpdateFunction
// を上書きする。最後に model.update() を呼び出すため。
const updateFunctions = ref<UpdateFunction[]>([]);
provide<ProvidedRegisterUpdateFunction>('RegisterUpdateFunction', (updateFunction: UpdateFunction) => {
  updateFunctions.value.push(updateFunction);
});
provide<ProvidedRegisterUpdateFunction>('UnregisterUpdateFunction', (updateFunction: UpdateFunction) => {
  const index = updateFunctions.value.indexOf(updateFunction);
  if (index !== -1) {
    updateFunctions.value.splice(index, 1);
  }
});

/**
 * Live2Dモデルの更新処理を行う関数
 * この関数はアニメーションフレームごとに呼び出される
 *
 * @param deltaTime 前回のフレームからの経過時間（秒）
 */
function update(deltaTime: number) {
  // モデルが初期化されていない場合は更新処理をスキップ
  if (!initialized.value) {
    return;
  }
  // モデルアセットから必要なコンポーネントを取り出す
  const {
    model,          // Live2Dモデル本体
    pose,           // ポーズ制御オブジェクト
  } = assets.value;

  if (!model) {
    logger.error('Model is not found');
    return;
  }

  // Live2Dモデルの更新処理フロー
  updateFunctions.value.forEach((updateFunction) => {
    updateFunction(deltaTime);
  });

  // ポーズの更新
  pose?.updateParameters(model, deltaTime);
  // モデル全体の状態を更新して描画準備を完了
  model.update();
}

// コンポーネントがDOMにマウントされたときの処理
onMounted(() => {
  // アニメーションループに更新関数を登録
  registerUpdateFunction(update);
  // 初期化完了フラグを設定
  initialized.value = true;
});

// コンポーネントがDOMからアンマウントされるときの処理
onBeforeUnmount(() => {
  // 初期化状態を未初期化に戻す
  initialized.value = false;
  // アニメーションループから更新関数の登録を解除
  unregisterUpdateFunction(update);
});
</script>
