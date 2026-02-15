<template>
  <slot v-if="initialized"></slot>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import type { ProvidedCubismModelAssets } from '../live2d/components/VCubismModelAssetsProvider.vue';
import type { ProvidedRegisterUpdateFunction, ProvidedUnregisterUpdateFunction } from '../live2d/components/VCubismRenderLoopProvider.vue';
import { safeInject } from '../live2d/utils/safeInject';
import { logger } from '../logger';
import { getCurrentAndPreviousMora } from '../utils/lipsync/getCurrentAndPreviousMora';
import { vowelToMouthParameters, type MouthParameters } from '../utils/lipsync/vowelToMouthParameter';
import { easeOutCubic } from '../utils/math/easing';
import { lerp } from '../utils/math/lerp';
import { createMorasWithPauses } from '../utils/voicevox/createMorasWithPauses';
import type { VoiceVoxAudioQuery } from '../utils/voicevox/type/VoiceVoxAudioQuery';
import type { VoiceVoxMora } from '../utils/voicevox/type/VoiceVoxMora';

// コンポーネントのプロパティ定義
const props = withDefaults(defineProps<{
  // VOICEVOXの音声合成クエリ
  audioQueries: VoiceVoxAudioQuery[];
}>(), {
});

// イベント定義
export interface VVoicevoxLipsyncEvent {
  audioQueries: VoiceVoxAudioQuery[];
}
const emit = defineEmits<{
  // 口パク開始時に発火するイベント
  (event: 'start', e: VVoicevoxLipsyncEvent): void;
  // 口パク終了時に発火するイベント
  (event: 'ended', e: VVoicevoxLipsyncEvent): void;
}>();

// モデルの初期化状態を管理するリアクティブな変数
const initialized = ref(false);

// 音素データ、音声ファイル、再生状態を管理する変数
const moras = ref<VoiceVoxMora[]>([]);
const elapsedTime = ref(0);

// Live2Dモデルの口パラメータのインデックスを保持するオブジェクト
const paramIndexes = reactive<Record<keyof MouthParameters, number>>({
  'ParamA': -1,
  'ParamI': -1,
  'ParamU': -1,
  'ParamE': -1,
  'ParamO': -1,
  'ParamMouthOpenY': -1,
  'ParamMouthForm': -1,
});

// 親コンポーネントからLive2Dモデルのアセット情報と更新関数を注入
const assets = safeInject<ProvidedCubismModelAssets>('CubismModelAssets');
// 更新関数の登録と解除関数を注入
const registerUpdateFunction = safeInject<ProvidedRegisterUpdateFunction>('RegisterUpdateFunction');
const unregisterUpdateFunction = safeInject<ProvidedUnregisterUpdateFunction>('UnregisterUpdateFunction');

/**
 * リップシンク更新関数
 * @param deltaTime 前回のフレームからの経過時間（秒）
 */
function update(deltaTime: number) {
  // 初期化が完了していない場合は処理しない
  if (!initialized.value) {
    return;
  }

  const { model } = assets.value;
  if (!model) {
    logger.error('モデルが見つかりません');
    return;
  }

  // 経過時間を更新
  elapsedTime.value += deltaTime;

  // 現在と直前の音素情報を特定
  const { currentMora, currentMoraTime, previousMora, previousMoraTime } = getCurrentAndPreviousMora(moras.value, elapsedTime.value);

  if (currentMora && previousMoraTime < currentMoraTime) {
    // 現在の音素の母音に対応する口パラメータを取得
    const currentMouthParams = vowelToMouthParameters(currentMora.vowel);
    // 直前の音素の母音に対応する口パラメータを取得
    const previousMouthParams = vowelToMouthParameters(previousMora?.vowel ?? 'pau');
    // パラメータ補完のための時間を計算
    const t = easeOutCubic((elapsedTime.value - previousMoraTime) / (currentMoraTime - previousMoraTime));

    // ParamA/I/U/E/Oが存在する場合はそれぞれのパラメータを補間
    if (paramIndexes.ParamA >= 0 && paramIndexes.ParamI >= 0 && paramIndexes.ParamU >= 0 && paramIndexes.ParamE >= 0 && paramIndexes.ParamO >= 0) {
      model.setParameterValueByIndex(paramIndexes.ParamA, lerp(previousMouthParams.ParamA, currentMouthParams.ParamA, t));
      model.setParameterValueByIndex(paramIndexes.ParamI, lerp(previousMouthParams.ParamI, currentMouthParams.ParamI, t));
      model.setParameterValueByIndex(paramIndexes.ParamU, lerp(previousMouthParams.ParamU, currentMouthParams.ParamU, t));
      model.setParameterValueByIndex(paramIndexes.ParamE, lerp(previousMouthParams.ParamE, currentMouthParams.ParamE, t));
      model.setParameterValueByIndex(paramIndexes.ParamO, lerp(previousMouthParams.ParamO, currentMouthParams.ParamO, t));
    }
    else {
      // ParamA/I/U/E/Oが存在しない場合はMouthOpenYとMouthFormを補完
      if (paramIndexes.ParamMouthOpenY >= 0) {
        model.setParameterValueByIndex(paramIndexes.ParamMouthOpenY, lerp(previousMouthParams.ParamMouthOpenY, currentMouthParams.ParamMouthOpenY, t));
      }
      if (paramIndexes.ParamMouthForm >= 0) {
        model.setParameterValueByIndex(paramIndexes.ParamMouthForm, lerp(previousMouthParams.ParamMouthForm, currentMouthParams.ParamMouthForm, t));
      }
    }
  }
}

/**
 * テキストを音声合成して再生する
 * @param text 発声するテキスト
 * @param speaker 話者ID
 */
function speak(audioQueries: VoiceVoxAudioQuery[]) {
  // 未初期化または空のテキストの場合は処理しない
  if (!initialized.value || !audioQueries.length) {
    return;
  }

  moras.value = [];
  for (const query of audioQueries) {
    // 音声データを取得
    moras.value.push(...createMorasWithPauses(query));
  }

  // 経過時間をリセット（口パラメータのアニメーション用）
  elapsedTime.value = 0;

  // 口パク開始イベントを発火
  emit('start', { audioQueries });
}

/**
 *
 */
function initMouthParameters() {
  const { model } = assets.value;
  if (!model) {
    logger.error('モデルが見つかりません');
    return;
  }

  // すべてのパラメータを走査して口形状関連のパラメータを探す
  const paramCount = model.getParameterCount()
  for (let i = 0; i < paramCount; i++) {
    const paramId = model.getParameterId(i)

    // 各母音と口の形状パラメータのインデックスを記録
    if (paramId.isEqual('ParamA')) {
      paramIndexes.ParamA = i
    } else if (paramId.isEqual('ParamI')) {
      paramIndexes.ParamI = i
    } else if (paramId.isEqual('ParamU')) {
      paramIndexes.ParamU = i
    } else if (paramId.isEqual('ParamE')) {
      paramIndexes.ParamE = i
    } else if (paramId.isEqual('ParamO')) {
      paramIndexes.ParamO = i
    } else if (paramId.isEqual('ParamMouthOpenY')) {
      paramIndexes.ParamMouthOpenY = i
    } else if (paramId.isEqual('ParamMouthForm')) {
      paramIndexes.ParamMouthForm = i
    }
  }
}

// コンポーネントがマウントされたときの初期化処理
onMounted(() => {
  const { modelSetting, model } = assets.value;
  if (!modelSetting || !model) {
    logger.error('モデル設定またはモデルが見つかりません');
    return;
  }

  // 口パラメータのインデックスを初期化
  initMouthParameters();

  // アニメーションループに更新関数を登録
  registerUpdateFunction(update);

  // 初期化完了フラグを設定
  initialized.value = true;

  // 初期テキストの発話を開始
  speak(props.audioQueries);
});

// コンポーネントがアンマウントされるときのクリーンアップ処理
onUnmounted(() => {
  initialized.value = false;
  unregisterUpdateFunction(update);
});

// テキストまたは話者IDが変更された場合に自動的に発話を更新
watch(() => ({ ...props.audioQueries }), async () => {
  await speak(props.audioQueries);
});
</script>
