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
import { WavFileReader } from '@/utils/audio/WavFileReader';
import { WavFileWriter } from '@/utils/audio/WavFileWriter';
import { requestAudioQueries } from '@/utils/voicevox/requestAudioQuery';
import { requestMultiSynthesis } from '@/utils/voicevox/requestSynthesis';
import { splitSentence } from '@/utils/voicevox/splitSentence';
import type { VoiceVoxAudioQuery } from '@/utils/voicevox/type/VoiceVoxAudioQuery';
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch, type ShallowRef } from 'vue';

interface NovelGameText {
  character: ShallowRef<Character> | null;
  text: string;
  motionGroupName: string | null;
  motionIndex: number | null;
  expressionIndex: number | null;
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
   * キャラクターをタップしたときの処理
   */
  async speak(text: string, motionGroupName: string, motionIndex: number, expressionIndex: number | null) {
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
    this.motionGroupName.value = motionGroupName;
    this.motionIndex.value = motionIndex;
    this.expressionIndex.value = expressionIndex;
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

const mao = shallowRef<Character>(new Character('Mao', 'マオ', { x: -0.6, y: -0.95, scale: 3, voiceSpeaker: 3 }));
const hiyori = shallowRef<Character>(new Character('Hiyori', 'ヒヨリ', { x: 0.6, y: -0.9, scale: 3, voiceSpeaker: 2 }));

/**
 * Mao：「ねえねえ、今日は魔法の実験に付き合ってくれない？新しい呪文を考えたんだ！」
 * Hiyori：「また？前回の実験で教室が虹色になって、先生に怒られたばかりなのに...」
 * Mao：「大丈夫、大丈夫！今回はもっと小さな魔法だから。それに、成功したら宿題を手伝ってあげるよ！」
 * Hiyori：「約束する？本当に危なくないの？」
 * Mao：「もちろん！...たぶん。ほら、この青い瓶と緑の液体を混ぜるだけだから。何も起こらなかったら、おやつをおごるよ！」
 * Hiyori：「はぁ...わかったわ。でも今度変なことになったら、一緒に謝りに行くからね？」
 * Mao：「やった！それじゃあ、準備して...魔法の時間、始まるよ！」
 */
const novelGameTexts = ref<NovelGameText[]>([
  {
    character: null,
    text: 'クリックすると次のセリフに進みます。',
    motionGroupName: null,
    motionIndex: null,
    expressionIndex: null,
  },
  {
    character: mao,
    text: 'ねえねえ、今日は魔法の実験に付き合ってくれない？新しい呪文を考えたんだ！',
    motionGroupName: 'TapBody',
    motionIndex: 1,
    expressionIndex: 3,
  },
  {
    character: hiyori,
    text: 'また？前回の実験で教室が虹色になって、先生に怒られたばかりなのに...',
    motionGroupName: 'Idle',
    motionIndex: 5,
    expressionIndex: null,
  },
  {
    character: mao,
    text: '大丈夫、大丈夫！今回はもっと小さな魔法だから。それに、成功したら宿題を手伝ってあげるよ！',
    motionGroupName: 'TapBody',
    motionIndex: 2,
    expressionIndex: 1,
  },
  {
    character: hiyori,
    text: '約束する？本当に危なくないの？',
    motionGroupName: 'Idle',
    motionIndex: 7,
    expressionIndex: null,
  },
  {
    character: mao,
    text: 'もちろん！...たぶん。ほら、この青い瓶と緑の液体を混ぜるだけだから。何も起こらなかったら、おやつをおごるよ！',
    motionGroupName: 'Idle',
    motionIndex: 0,
    expressionIndex: 6,
  },
  {
    character: hiyori,
    text: 'はぁ...わかったわ。でも今度変なことになったら、一緒に謝りに行くからね？',
    motionGroupName: 'Idle',
    motionIndex: 8,
    expressionIndex: null,
  },
  {
    character: mao,
    text: 'やった！それじゃあ、準備して...魔法の時間、始まるよ！',
    motionGroupName: 'TapBody',
    motionIndex: 3,
    expressionIndex: null,
  },
]);
const currentTextIndex = ref<number>(0);
const currentText = computed(() => novelGameTexts.value[currentTextIndex.value]);
const currentCharIndex = ref<number>(0);
const currentChars = computed(() => currentText.value.text.slice(0, currentCharIndex.value));
watch(currentText, () => {
  currentCharIndex.value = 0
  currentText.value.character?.speak(
    currentText.value.text,
    currentText.value.motionGroupName ?? 'Idle',
    currentText.value.motionIndex ?? 0,
    currentText.value.expressionIndex
  );
});
const charIncrementIntervalId = ref<ReturnType<typeof setInterval> | null>(null);
onMounted(() => {
  charIncrementIntervalId.value = setInterval(() => {
    if (currentCharIndex.value < currentText.value.text.length) {
      currentCharIndex.value++;
    }
  }, 30);
});
onBeforeUnmount(() => {
  if (charIncrementIntervalId.value) {
    clearInterval(charIncrementIntervalId.value);
  }
});
</script>

<template>
  <section @click="currentTextIndex = (currentTextIndex + 1) % novelGameTexts.length">
    <header class="pb-4">
      <h2 class="py-4">ノベルゲーム風</h2>
      <p class="text-gray-500 dark:text-gray-400">
        キャラクターがセリフを話すノベルゲーム風のデモです。クリックすると次のセリフに進みます。
      </p>
    </header>
    <div class="character-container flex flex-col md:flex-row gap-4">
      <div class="rounded-lg overflow-hidden relative">
        <!-- フレームワーク初期化 -->
        <VCubismFramework>
          <!-- WebGL描画用のCanvasをマウントし、WebGLコンテキストを提供 -->
          <VCubismCanvasWebGLProvider class="w-full aspect-video" width="1280" height="720">
            <!-- 描画ループを提供 -->
            <VCubismRenderLoopProvider :fps="30">
              <VCubismSpriteRenderer :src="'DALL·E background.webp'" :z-index="-1" />
              <!-- プロジェクション行列を提供 -->
              <VCubismProjectionMatrixProvider>
                <!-- ViewMatrixを提供 -->
                <VCubismViewMatrixProvider>
                  <!-- モデルアセットを読み込み提供 -->
                  <VCubismModelAssetsProvider v-for="character in [mao, hiyori]" :key="character.name.value"
                    :model-home-dir="character.homeDir.value" :model-file-name="character.fileName.value">
                    <!-- モデルの更新処理 -->
                    <VCubismUpdateModel>
                      <!-- モーションの更新処理 -->
                      <VCubismUpdateModelMotion>
                        <VCubismUpdateModelEyeBlink />
                      </VCubismUpdateModelMotion>
                      <!-- 呼吸の更新処理 -->
                      <VCubismUpdateModelBreath />
                      <!-- 物理演算の更新処理 -->
                      <VCubismUpdateModelPhysics />
                      <!-- 表情の更新処理 -->
                      <VCubismUpdateModelExpression />
                      <!-- 音声合成とリップシンク -->
                      <VVoicevoxLipsync :audio-queries="character.audioQueries.value" />
                    </VCubismUpdateModel>
                    <!-- モデル座標設定用の行列を提供 -->
                    <VCubismModelMatrixProvider :scaleX="character.scale.value" :scaleY="character.scale.value"
                      :translateX="character.x.value" :translateY="character.y.value">
                      <!-- モデルのレンダー処理 -->
                      <VCubismModelAssetsRenderer :z-index="currentText.character === character ? 1 : 0" />
                    </VCubismModelMatrixProvider>
                    <!-- モーションを管理するコンポーネント -->
                    <VCubismMotionManager :group="character.motionGroupName.value" :index="character.motionIndex.value"
                      :loop="false" />
                    <!-- 表情を管理するコンポーネント -->
                    <VCubismExpressionManager :index="character.expressionIndex.value" />
                  </VCubismModelAssetsProvider>
                </VCubismViewMatrixProvider>
              </VCubismProjectionMatrixProvider>
            </VCubismRenderLoopProvider>
          </VCubismCanvasWebGLProvider>
        </VCubismFramework>
        <div class="absolute bottom-0 left-0 right-0 px-4 py-2 bg-blue-950/90 bg-opacity-50 h-32">
          <p class="text-gray-200 pb-2">{{ currentText.character?.nameJapanese }}</p>
          <p class="text-sm text-gray-200">{{ currentChars }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.controls {
  width: 100%;
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 8px;
}
</style>
