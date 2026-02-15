<template>
  <slot v-if="initialized"></slot>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { logger } from '../../logger';
import { safeInject } from '../utils/safeInject';
import type { ProvidedCubismModelAssets } from './VCubismModelAssetsProvider.vue';
import type { ProvidedRegisterUpdateFunction, ProvidedUnregisterUpdateFunction } from './VCubismRenderLoopProvider.vue';

// モデルの初期化状態を管理するリアクティブな変数
const initialized = ref(false);

// CubismModelAssets関数の注入
const assets = safeInject<ProvidedCubismModelAssets>('CubismModelAssets');

// Live2Dモデルの更新関数を登録するための関数を親コンポーネントから注入
const registerUpdateFunction = safeInject<ProvidedRegisterUpdateFunction>('RegisterUpdateFunction');

// 登録した更新関数を解除するための関数を親コンポーネントから注入
const unregisterUpdateFunction = safeInject<ProvidedUnregisterUpdateFunction>('UnregisterUpdateFunction');


// プロパティ定義
const props = withDefaults(defineProps<{
  // 視線のX座標
  gazeX: number | null;
  // 視線のY座標
  gazeY: number | null;
  // 顔の傾きのX座標
  faceAngleX: number | null;
  // 顔の傾きのY座標
  faceAngleY: number | null;
  // 体の傾きのX座標
  bodyAngleX: number | null;
}>(), {
  gazeX: null,
  gazeY: null,
  faceAngleX: null,
  faceAngleY: null,
  faceAngleZ: null,
  bodyAngleX: null,
});


export interface PoseParameters {
  GazeX: number | null;
  GazeY: number | null;
  FaceAngleX: number | null;
  FaceAngleY: number | null;
  FaceAngleZ: number | null;
  BodyAngleX: number | null;
}

const paramIndexes = ref<Record<keyof PoseParameters, number>>({
  'GazeX': -1,
  'GazeY': -1,
  'FaceAngleX': -1,
  'FaceAngleY': -1,
  'FaceAngleZ': -1,
  'BodyAngleX': -1,
});

function initializeParameterIndexes() {
  const { model } = assets.value;
  if (!model) {
    logger.error('モデルが見つかりません');
    return;
  }

  // すべてのパラメータを走査して口形状関連のパラメータを探す
  const paramCount = model.getParameterCount()
  for (let i = 0; i < paramCount; i++) {
    const paramId = model.getParameterId(i)

    if (paramId.isEqual('ParamEyeBallX')) {
      paramIndexes.value.GazeX = i;
    } else if (paramId.isEqual('ParamEyeBallY')) {
      paramIndexes.value.GazeY = i;
    } else if (paramId.isEqual('ParamAngleX')) {
      paramIndexes.value.FaceAngleX = i;
    } else if (paramId.isEqual('ParamAngleY')) {
      paramIndexes.value.FaceAngleY = i;
    } else if (paramId.isEqual('ParamAngleZ')) {
      paramIndexes.value.FaceAngleZ = i;
    } else if (paramId.isEqual('ParamBodyAngleX')) {
      paramIndexes.value.BodyAngleX = i;
    }
  }
}

/**
 * 視線・顔・姿勢を更新する
 */
function update(deltaTime: number) {
  if (!initialized.value) {
    return;
  }

  const { model } = assets.value;

  if (!model) {
    logger.error('モデルが取得できませんでした');
    return;
  }

  // 視線の更新
  model.addParameterValueByIndex(paramIndexes.value.GazeX, (props.gazeX ?? 0));
  model.addParameterValueByIndex(paramIndexes.value.GazeY, (props.gazeY ?? 0));

  // 顔の傾きの更新
  model.addParameterValueByIndex(paramIndexes.value.FaceAngleX, (props.faceAngleX ?? 0) * 30.0);
  model.addParameterValueByIndex(paramIndexes.value.FaceAngleY, (props.faceAngleY ?? 0) * 30.0);
  model.addParameterValueByIndex(paramIndexes.value.FaceAngleZ, (props.faceAngleX ?? 0) * (props.faceAngleY ?? 0) * -30.0);

  // 体の傾きの更新
  model.addParameterValueByIndex(paramIndexes.value.BodyAngleX, (props.bodyAngleX ?? 0) * 10.0);
}

// コンポーネントマウント時にポーズを更新
onMounted(() => {
  initializeParameterIndexes();
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
