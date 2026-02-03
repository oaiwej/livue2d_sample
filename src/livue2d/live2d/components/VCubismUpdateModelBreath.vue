<template>
  <slot v-if="initialized"></slot>
</template>

<script setup lang="ts">
import { logger } from '@/logger';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { safeInject } from '../utils/safeInject';
import type { ProvidedCubismModelAssets } from './VCubismModelAssetsProvider.vue';
import type { ProvidedRegisterUpdateFunction, ProvidedUnregisterUpdateFunction } from './VCubismRenderLoopProvider.vue';

// モデルの初期化状態を管理するリアクティブな変数
const initialized = ref(false);

// 親コンポーネントからLive2Dモデルのアセット情報を注入
const assets = safeInject<ProvidedCubismModelAssets>('CubismModelAssets');

// Live2Dモデルの更新関数を登録するための関数を親コンポーネントから注入
const registerUpdateFunction = safeInject<ProvidedRegisterUpdateFunction>('RegisterUpdateFunction');

// 登録した更新関数を解除するための関数を親コンポーネントから注入
const unregisterUpdateFunction = safeInject<ProvidedUnregisterUpdateFunction>('UnregisterUpdateFunction');

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
    breath,         // 呼吸制御オブジェクト
  } = assets.value;

  if (!model) {
    logger.error('Model is not found');
    return;
  }
  // 呼吸パラメータの更新
  breath?.updateParameters(model, deltaTime);
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
