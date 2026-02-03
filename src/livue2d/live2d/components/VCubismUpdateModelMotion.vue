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
// を上書き。
// モーションによる更新と重複するのを避けるため。
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
    motionManager,  // モーション管理オブジェクト
  } = assets.value;

  if (!model) {
    logger.error('Model is not found');
    return;
  }

  // Live2Dモデルの更新処理フロー

  // 1. 現在のパラメータを読み込む
  model.loadParameters();

  // 2. モーションによるパラメータ更新（戻り値はモーションによる更新があったかどうか）
  const motionUpdated = motionManager?.updateMotion(model, deltaTime);

  // 3. 更新されたパラメータを保存
  model.saveParameters();

  // 4. モーションによる更新がなかった場合のみ子孫コンポーネントの更新関数を実行
  if (!motionUpdated) {
    // 子孫コーンポーネントに登録された更新関数を実行
    updateFunctions.value.forEach((updateFunction) => updateFunction(deltaTime));
  }
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
