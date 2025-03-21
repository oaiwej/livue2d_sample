<script setup lang="ts">
import VVoicevoxLipsync from '@/components/VVoicevoxLipsync.vue';
import VCubismCanvasWebGLProvider from '@/live2d/components/VCubismCanvasWebGLProvider.vue';
import VCubismExpressionManager from '@/live2d/components/VCubismExpressionManager.vue';
import VCubismFramework from '@/live2d/components/VCubismFramework.vue';
import VCubismModelAssetsProvider, { type CubismModelAssets } from '@/live2d/components/VCubismModelAssetsProvider.vue';
import VCubismModelAssetsRenderer from '@/live2d/components/VCubismModelAssetsRenderer.vue';
import VCubismModelMatrixProvider from '@/live2d/components/VCubismModelMatrixProvider.vue';
import VCubismMotionManager from '@/live2d/components/VCubismMotionManager.vue';
import VCubismProjectionMatrixProvider from '@/live2d/components/VCubismProjectionMatrixProvider.vue';
import VCubismRenderLoopProvider from '@/live2d/components/VCubismRenderLoopProvider.vue';
import VCubismSpriteRenderer from '@/live2d/components/VCubismSpriteRenderer.vue';
import VCubismUpdateModel from '@/live2d/components/VCubismUpdateModel.vue';
import VCubismUpdateModelBreath from '@/live2d/components/VCubismUpdateModelBreath.vue';
import VCubismUpdateModelExpression from '@/live2d/components/VCubismUpdateModelExpression.vue';
import VCubismUpdateModelEyeBlink from '@/live2d/components/VCubismUpdateModelEyeBlink.vue';
import VCubismUpdateModelMotion from '@/live2d/components/VCubismUpdateModelMotion.vue';
import VCubismUpdateModelPhysics from '@/live2d/components/VCubismUpdateModelPhysics.vue';
import VCubismViewMatrixProvider from '@/live2d/components/VCubismViewMatrixProvider.vue';
import { logger } from '@/logger';
import { CharacterChatWithExpression } from '@/utils/llm/CharacterChatWithExpression';
import { computed, onUpdated, ref, shallowRef, watch } from 'vue';

interface ChatMessage {
  text: string;
  isUser: boolean;
}

const text = ref(''); // ユーザーの入力
// チャットメッセージのリスト
const chatMessages = ref<ChatMessage[]>([
  { text: 'こんにちは！チャットでお話ししましょう！', isUser: false }
]);
// チャット用のインスタンス
const characterChat = shallowRef<CharacterChatWithExpression>(new CharacterChatWithExpression([
  {
    role: 'system',
    content: `あなたは魔女見習いの「マオ」として明るくフランクに返答してください。必ず日本語で返答してください。`,
  }
]));

/**
 * ユーザーの入力を送信
 */
async function onSubmit() {
  if (!text.value.trim()) return;

  // ユーザーのメッセージを追加
  const userMessage = text.value;
  chatMessages.value.push({ text: userMessage, isUser: true });

  // 入力欄をクリア
  text.value = '';

  try {
    // APIからの応答を取得
    logger.debug('Sending message to LLM:', userMessage);
    const response = await characterChat.value.completion(userMessage);
    logger.debug('Received response:', response);

    if (response.text) {
      speechText.value = response.text;
      // キャラクターの応答を追加
      chatMessages.value.push({ text: response.text, isUser: false });
      // 表情とモーションを設定
      switch (response.expression) {
        case 'happy':
          expressionIndex.value = 1;
          motionGroupName.value = 'TapBody';
          motionIndex.value = 2;
          break;

        case 'sad':
          expressionIndex.value = 4;
          motionGroupName.value = 'TapBody';
          motionIndex.value = 1;
          break;

        case 'angry':
          expressionIndex.value = 7;
          motionGroupName.value = 'TapBody';
          motionIndex.value = 0;
          break;

        case 'surprised':
          expressionIndex.value = 6;
          motionGroupName.value = 'Idle';
          motionIndex.value = 0;
          break;

        case 'blush':
          expressionIndex.value = 5;
          motionGroupName.value = 'TapBody';
          motionIndex.value = 1;
          break;

        case 'normal':
        default:
          expressionIndex.value = 0;
          motionGroupName.value = 'Idle';
          motionIndex.value = 0;
          break;
      }
    }
  } catch (error) {
    logger.error('Error getting response:', error);
    chatMessages.value.push({ text: 'すみません、エラーが発生しました。', isUser: false });
  }
}

// canvasのサイズ
const canvasWidth = ref(1024);
const canvasHeight = ref(1024);

// Live2Dモデルの設定
// モデルのホームディレクトリとファイル名を定義
const modelName = ref('Mao');
const modelHomeDir = computed<string>(() => `/Resources/${modelName.value}/`);
const modelFileName = computed<string>(() => `${modelName.value}.model3.json`);

// モーショングループ名
const motionGroupName = ref<string>('Idle');
// モーションのインデックス
const motionIndex = ref<number | null>(0);
// 表情のインデックス
const expressionIndex = ref<number | null>(null);

/**
 * アセットのロード完了時の処理
 * @param assets - ロードされたCubismモデルのアセット
 */
function assetsLoaded(assets: CubismModelAssets) {
  if (!assets.modelSetting) {
    console.error('Failed to load model setting');
    return;
  }
  console.log('Assets loaded');

  motionGroupName.value = 'Idle';
  motionIndex.value = 0;
  expressionIndex.value = null;
}

// 音声合成のテキスト
const speechText = ref('');
/**
 * 音声合成が終了したときの処理
 */
function onSpeechEnd() {
  speechText.value = ''; // テキストをクリア
}

// チャットボックスのスクロール制御
const chatBox = ref<HTMLElement | null>(null);
const shouldScrollChat = ref(false);
watch(() => chatMessages.value.length, () => {
  shouldScrollChat.value = true;
});
onUpdated(() => {
  if (shouldScrollChat.value) {
    chatBox.value?.scrollTo({ top: chatBox.value.scrollHeight, behavior: 'smooth' });
    shouldScrollChat.value = false;
  }
});
</script>

<template>
  <section class="flex flex-col h-[calc(100vh-10rem)] min-h-64 overflow-hidden">
    <header class="pb-4 block">
      <h2 class="text-gray-600 dark:text-gray-200 text-xl py-4">LLMとのチャットとモデルの制御</h2>
      <p class="text-gray-500 dark:text-gray-400">
        ユーザーの入力に応じてLLMが返答し、Function CallingによってLive2Dモデルの表情とモーションを制御します。
      </p>
    </header>
    <div class="flex-1 flex flex-row gap-4 overflow-hidden">
      <div class="rounded-lg overflow-hidden relative flex-1">
        <!-- フレームワーク初期化 -->
        <VCubismFramework>
          <!-- WebGL描画用のCanvasをマウントし、WebGLコンテキストを提供 -->
          <VCubismCanvasWebGLProvider class="w-full aspect-square" :width="canvasWidth" :height="canvasHeight">
            <!-- プロジェクション行列を提供 -->
            <VCubismProjectionMatrixProvider>
              <!-- ViewMatrixを提供 -->
              <VCubismViewMatrixProvider>
                <!-- 描画ループを提供 -->
                <VCubismRenderLoopProvider :fps="30">
                  <!-- 背景画像の描画 -->
                  <VCubismSpriteRenderer :src="'/Resources/back_class_normal.png'" />
                  <!-- モデルアセットを読み込み提供 -->
                  <VCubismModelAssetsProvider @loaded="assetsLoaded" :model-home-dir="modelHomeDir"
                    :model-file-name="modelFileName">
                    <!-- モデルの更新処理 -->
                    <VCubismUpdateModel>
                      <!-- モーションの更新処理 -->
                      <VCubismUpdateModelMotion>
                        <!-- まばたきの更新処理 -->
                        <VCubismUpdateModelEyeBlink />
                      </VCubismUpdateModelMotion>
                      <!-- 呼吸の更新処理 -->
                      <VCubismUpdateModelBreath />
                      <!-- 物理演算の更新処理 -->
                      <VCubismUpdateModelPhysics />
                      <!-- 表情の更新処理 -->
                      <VCubismUpdateModelExpression />
                      <!-- 音声合成とリップシンク -->
                      <VVoicevoxLipsync :text="speechText" :speaker="3" :speed-scale="1.2" @ended="onSpeechEnd" />
                    </VCubismUpdateModel>
                    <!-- モデル座標設定用の行列を提供 -->
                    <VCubismModelMatrixProvider :scale-x="3" :scale-y="3" :translate-x="0" :translate-y="-0.9">
                      <!-- モデルのレンダー処理 -->
                      <VCubismModelAssetsRenderer />
                    </VCubismModelMatrixProvider>
                    <!-- モーションを管理するコンポーネント -->
                    <VCubismMotionManager :group="motionGroupName" :index="motionIndex" />
                    <!-- 表情を管理するコンポーネント -->
                    <VCubismExpressionManager :index="expressionIndex" />
                  </VCubismModelAssetsProvider>
                </VCubismRenderLoopProvider>
              </VCubismViewMatrixProvider>
            </VCubismProjectionMatrixProvider>
          </VCubismCanvasWebGLProvider>
        </VCubismFramework>
      </div>

      <!-- チャットボックス -->
      <div class="bg-slate-900 rounded-xl flex flex-col flex-1">
        <div class="flex-1 flex flex-col overflow-y-auto" ref="chatBox">
          <div class="flex flex-col gap-2 p-4">
            <div v-for="(message, index) in chatMessages" :key="index" :class="['mb-2 p-2 rounded break-all whitespace-pre-wrap', message.isUser
              ? 'bg-green-200 dark:bg-green-700 dark:text-gray-200 self-end'
              : 'bg-white dark:bg-gray-700 dark:text-gray-200']" style="max-width: 80%">
              {{ message.text }}
            </div>
          </div>
        </div>
        <form @submit.prevent="onSubmit" class="flex p-2 border-t border-gray-700">
          <input type="text" v-model="text" placeholder="メッセージを入力..."
            class="border border-gray-300 rounded-l px-4 py-2 flex-1" />
          <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded-r">送信</button>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped></style>
