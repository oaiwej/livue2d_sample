<script setup lang="ts">
import VVoicevoxLipsync from '@/components/VVoicevoxLipsync.vue';
import VCubismCanvasWebGLProvider from '@/live2d/components/VCubismCanvasWebGLProvider.vue';
import VCubismExpressionManager from '@/live2d/components/VCubismExpressionManager.vue';
import VCubismFramework from '@/live2d/components/VCubismFramework.vue';
import VCubismModelAssetsProvider from '@/live2d/components/VCubismModelAssetsProvider.vue';
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
import { CharacterChatWithExpression } from '@/utils/app/CharacterChatWithExpression';
import { WavFileReader } from '@/utils/audio/WavFileReader';
import { WavFileWriter } from '@/utils/audio/WavFileWriter';
import { requestAudioQueries } from '@/utils/voicevox/requestAudioQuery';
import { requestMultiSynthesis } from '@/utils/voicevox/requestSynthesis';
import { splitSentence } from '@/utils/voicevox/splitSentence';
import type { VoiceVoxAudioQuery } from '@/utils/voicevox/type/VoiceVoxAudioQuery';
import { computed, nextTick, ref, shallowRef, watch } from 'vue';

interface ChatMessage {
  text: string;
  isUser: boolean;
}


class Character {
  name = ref<string>('');
  nameJapanese = ref<string>('');
  homeDir = computed<string>(() => `/Resources/${this.name.value}/`);
  fileName = computed<string>(() => `${this.name.value}.model3.json`);
  text = ref<string>('');
  motionGroupName = ref<string>('Idle');
  motionIndex = ref<number>(0);
  expressionIndex = ref<number | null>(null);
  voiceSpeaker = ref<number>(0);
  audioQueries = ref<VoiceVoxAudioQuery[]>([]);
  speedScale = ref<number>(1.2);
  audio = shallowRef<HTMLAudioElement>(new Audio());
  x = ref<number>(0);
  y = ref<number>(0);
  scale = ref<number>(1);
  /**
   * キャラクター喋らせる処理
   */
  async speak(text: string, expressionType: string | null) {
    this.text.value = text;
    const audioQueries = await requestAudioQueries(splitSentence(this.text.value), this.voiceSpeaker.value);
    for (const query of audioQueries) {
      query.speedScale = this.speedScale.value;
    }
    const buffers = await requestMultiSynthesis(audioQueries, this.voiceSpeaker.value);
    const waves = buffers.map((buffer) => new WavFileReader(buffer));
    const wav = new WavFileWriter(waves[0].getFormat());
    wav.append(waves)
    this.releaseAudio();
    this.audio.value.src = URL.createObjectURL(new Blob([wav.getBuffer()], { type: 'audio/wav' }));
    this.audio.value.play();
    this.audioQueries.value = audioQueries;
    this.setExpression(expressionType);
  }

  /**
   * 口パク終了したときの処理
   */
  onSpeakEnded() {
    this.text.value = '';
    this.audioQueries.value = [];
  }

  /**
   * オーディオを停止して解放
   */
  releaseAudio() {
    const blobUrl = this.audio.value.src;
    this.audio.value.currentTime = 0;
    this.audio.value.src = '';
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
  }

  /**
   * 表情タイプからモーションと表情のインデックスを設定
   */
  setExpression(expression: string | null) {
    switch (expression) {
      case 'happy':
        this.expressionIndex.value = 1;
        this.motionGroupName.value = 'TapBody';
        this.motionIndex.value = 2;
        break;

      case 'sad':
        this.expressionIndex.value = 4;
        this.motionGroupName.value = 'TapBody';
        this.motionIndex.value = 1;
        break;

      case 'angry':
        this.expressionIndex.value = 7;
        this.motionGroupName.value = 'TapBody';
        this.motionIndex.value = 0;
        break;

      case 'surprised':
        this.expressionIndex.value = 6;
        this.motionGroupName.value = 'Idle';
        this.motionIndex.value = 0;
        break;

      case 'blush':
        this.expressionIndex.value = 5;
        this.motionGroupName.value = 'TapBody';
        this.motionIndex.value = 1;
        break;

      case 'normal':
      default:
        this.expressionIndex.value = 0;
        this.motionGroupName.value = 'Idle';
        this.motionIndex.value = 0;
        break;
    }
  }

  constructor(
    name: string,
    nameJapanese: string,
    options: {
      x?: number,
      y?: number,
      scale?: number,
      voiceSpeaker?: number,
    } = {}) {
    this.name.value = name;
    this.nameJapanese.value = nameJapanese;
    this.audio.value.onended = () => {
      this.releaseAudio();
    };
    this.x.value = options.x ?? this.x.value;
    this.y.value = options.y ?? this.y.value;
    this.scale.value = options.scale ?? this.scale.value;
    this.voiceSpeaker.value = options.voiceSpeaker ?? this.voiceSpeaker.value;
  }
}

// canvasのサイズ
const canvasWidth = ref(1024);
const canvasHeight = ref(1024);
// ユーザーの入力
const inputText = ref('');
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
  if (!inputText.value.trim()) return;

  // ユーザーのメッセージを追加
  const userMessage = inputText.value;
  chatMessages.value.push({ text: userMessage, isUser: true });

  // 入力欄をクリア
  inputText.value = '';

  try {
    // APIからの応答を取得
    logger.debug('Sending message to LLM:', userMessage);
    const response = await characterChat.value.completion(userMessage);
    logger.debug('Received response:', response);

    if (response.text) {
      // キャラクターの応答を追加
      chatMessages.value.push({ text: response.text, isUser: false });
      // 表情とモーションを設定
      mao.value.speak(response.text, response.expression);
    }
  } catch (error) {
    logger.error('Error getting response:', error);
    chatMessages.value.push({ text: 'すみません、エラーが発生しました。', isUser: false });
  }
}

// Live2Dモデルの設定
// モデルのホームディレクトリとファイル名を定義
const mao = shallowRef<Character>(new Character('Mao', 'マオ', {
  x: 0,
  y: -0.9,
  scale: 3,
  voiceSpeaker: 3,
}));

// チャットボックスのスクロール制御
const chatBox = ref<HTMLDivElement | null>(null);
const shouldScrollChat = ref(false);
watch(() => chatMessages.value.length, () => {
  shouldScrollChat.value = true;
  nextTick(() => {
    chatBox.value?.scrollTo({ top: chatBox.value?.scrollHeight, behavior: 'smooth' });
    shouldScrollChat.value = false;
  });
});
</script>

<template>
  <section class="flex flex-col h-[calc(100vh-10rem)] min-h-64 overflow-hidden">
    <header class="pb-4 block">
      <h2 class="py-4">LLMとのチャットとモデルの制御</h2>
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
                  <VCubismModelAssetsProvider v-for="character in [mao]" :key="character.name.value"
                    :model-home-dir="character.homeDir.value" :model-file-name="character.fileName.value">
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
                      <VVoicevoxLipsync :audio-queries="character.audioQueries.value"
                        @ended="character.onSpeakEnded()" />
                    </VCubismUpdateModel>
                    <!-- モデル座標設定用の行列を提供 -->
                    <VCubismModelMatrixProvider :scale-x="character.scale.value" :scale-y="character.scale.value"
                      :translate-x="character.x.value" :translate-y="character.y.value">
                      <!-- モデルのレンダー処理 -->
                      <VCubismModelAssetsRenderer />
                    </VCubismModelMatrixProvider>
                    <!-- モーションを管理するコンポーネント -->
                    <VCubismMotionManager :group="character.motionGroupName.value"
                      :index="character.motionIndex.value" />
                    <!-- 表情を管理するコンポーネント -->
                    <VCubismExpressionManager :index="character.expressionIndex.value" />
                  </VCubismModelAssetsProvider>
                </VCubismRenderLoopProvider>
              </VCubismViewMatrixProvider>
            </VCubismProjectionMatrixProvider>
          </VCubismCanvasWebGLProvider>
        </VCubismFramework>
      </div>

      <!-- チャットボックス -->
      <div class="bg-slate-300 dark:bg-slate-900 rounded-xl flex flex-col flex-1">
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
          <input type="text" v-model="inputText" placeholder="メッセージを入力..." class="flex-1" />
          <button type="submit" class="primary">送信</button>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped></style>
