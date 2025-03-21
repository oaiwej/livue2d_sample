<template>
  <slot v-if="initialized"></slot>
</template>

<script setup lang="ts">
import type { ProvidedCubismModelAssets } from '@/live2d/components/VCubismModelAssetsProvider.vue';
import type { ProvidedRegisterUpdateFunction, ProvidedUnregisterUpdateFunction } from '@/live2d/components/VCubismRenderLoopProvider.vue';
import { safeInject } from '@/live2d/utils/safeInject';
import { logger } from '@/logger';
import { concatWavArrayBuffers } from '@/utils/audio/concatWavArrayBuffers';
import { getCurrentAndPreviousMora } from '@/utils/lipsync/getCurrentAndPreviousMora';
import { vowelToMouthParameters, type MouthParameters } from '@/utils/lipsync/vowelToMouthParameter';
import { easeOutCubic } from '@/utils/math/easing';
import { lerp } from '@/utils/math/lerp';
import { createMorasWithPauses } from '@/utils/voicevox/createMorasWithPauses';
import { splitSentence } from '@/utils/voicevox/splitSentence';
import type { VoiceVoxMora } from '@/utils/voicevox/type/VoiceVoxMora';
import type { VoiceVoxQueryData } from '@/utils/voicevox/type/VoiceVoxQueryData';
import axios from 'axios';
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue';

// コンポーネントのプロパティ定義
const props = withDefaults(defineProps<{
  // 音声合成するテキスト
  text: string;
  // VOICEVOXの話者ID
  speaker: number;
  // 音声再生速度の倍率
  speedScale?: number;
  // VOICEVOXのAPIエンドポイント
  apiUrl?: string;
}>(), {
  speedScale: 1.0,
  apiUrl: import.meta.env.VITE_VOICEVOX_API_BASE_URL.replace(/\/$/, ''),
});

// イベント定義
export interface VVoicevoxLipsyncAudioEvent {
  text: string;
  speaker: number;
  speedScale?: number;
}
const emit = defineEmits<{
  // 音声再生開始時に発火するイベント
  (event: 'play', e: VVoicevoxLipsyncAudioEvent): void;
  // 音声再生終了時に発火するイベント
  (event: 'ended', e: VVoicevoxLipsyncAudioEvent): void;
}>();

// モデルの初期化状態を管理するリアクティブな変数
const initialized = ref(false);

// 音素データ、音声ファイル、再生状態を管理する変数
const moras = ref<VoiceVoxMora[]>([]);
const wavBlobUrl = ref<string | null>(null);
const elapsedTime = ref(0);
const audio = ref<HTMLAudioElement | null>(null);

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

  if (audio.value && !audio.value.paused) {
    // 経過時間を更新
    elapsedTime.value += deltaTime;

    // 現在と直前の音素情報を特定
    const { currentMora, currentMoraTime, previousMora, previousMoraTime } = getCurrentAndPreviousMora(moras.value, elapsedTime.value, props.speedScale);

    if (currentMora && previousMoraTime < currentMoraTime) {
      // 現在の音素の母音に対応する口パラメータを取得
      const currentMouthParams = vowelToMouthParameters(currentMora.vowel);
      // 直前の音素の母音に対応する口パラメータを取得
      const previousMouthParams = vowelToMouthParameters(previousMora?.vowel ?? 'pau');
      // パラメータ補完のための時間を計算
      const t = easeOutCubic((elapsedTime.value - previousMoraTime) / (currentMoraTime - previousMoraTime));

      // ParamA/I/U/E/Oが存在する場合はそれぞれのパラメータを補完
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
}

/**
 * テキストを音声合成して再生する
 * @param text 発声するテキスト
 * @param speaker 話者ID
 */
async function speak(text: string, speaker: number) {
  // 未初期化または空のテキストの場合は処理しない
  if (!initialized.value || !text.trim()) {
    return;
  }

  // テキストを文単位に分割
  const sentences = splitSentence(text).filter((s) => s.trim());

  moras.value = [];
  const wavDataList: ArrayBuffer[] = [];
  for (const sentence of sentences) {
    try {
      // 音声合成用クエリデータを取得
      const query_response = await axios.post(`${props.apiUrl}/audio_query`, null, {
        params: { text: sentence, speaker },
      })
      const queryData = query_response.data as VoiceVoxQueryData
      queryData.speedScale = props.speedScale

      // 音素情報を追加（前後の無音を含む）
      const sentenceMoras = createMorasWithPauses(queryData)
      moras.value.push(...sentenceMoras)

      // 音声データを取得
      const wav_response = await axios.post(`${props.apiUrl}/synthesis`, queryData, {
        params: { speaker },
        responseType: 'arraybuffer',
      })
      wavDataList.push(wav_response.data)

    } catch (error) {
      logger.error('音声合成でエラーが発生しました:', error);
    }
  }

  // 音声データを結合
  const wavData = concatWavArrayBuffers(wavDataList);
  if (!wavData) {
    logger.error('音声データの結合に失敗しました');
    return;
  }

  // 前回の音声データを解放
  releaseAudio();
  // 音声データを再生
  wavBlobUrl.value = URL.createObjectURL(new Blob([wavData], { type: 'audio/wav' }));
  audio.value = new Audio(wavBlobUrl.value);
  audio.value.onplay = () => emit('play', { text, speaker });
  audio.value.onended = () => emit('ended', { text, speaker });
  audio.value.play();

  // 経過時間をリセット（口パラメータのアニメーション用）
  elapsedTime.value = 0;
}

/**
 * 音声データのリソースを解放
 */
function releaseAudio() {
  if (audio.value) {
    audio.value.pause();
    audio.value.currentTime = 0;
    audio.value.src = '';
    audio.value = null;
  }
  if (wavBlobUrl.value) {
    URL.revokeObjectURL(wavBlobUrl.value);
  }
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

  // 音声データのリソースを解放
  releaseAudio();

  // アニメーションループに更新関数を登録
  registerUpdateFunction(update);

  // 初期化完了フラグを設定
  initialized.value = true;

  // 初期テキストの発話を開始
  speak(props.text, props.speaker);
});

// コンポーネントがアンマウントされるときのクリーンアップ処理
onUnmounted(() => {
  initialized.value = false;
  unregisterUpdateFunction(update);
  // 音声データのリソースを解放
  releaseAudio();
});

// テキストまたは話者IDが変更された場合に自動的に発話を更新
watch(() => [props.text, props.speaker], async () => {
  await speak(props.text, props.speaker);
});
</script>
