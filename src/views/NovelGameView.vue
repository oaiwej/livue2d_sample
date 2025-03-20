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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

interface NovelGameText {
  character: string;
  text: string;
  speaker: number;
  motionGroupName: string | null;
  motionIndex: number | null;
  expressionIndex: number | null;
}

const mao = ref<string>('Mao');
const maoHomeDir = computed<string>(() => `/Resources/${mao.value}/`);
const maoFileName = computed<string>(() => `${mao.value}.model3.json`);
const maoText = ref<string>('');
const maoMotionGroupName = ref<string | null>(null);
const maoMotionIndex = ref<number | null>(null);
const maoExpressionIndex = ref<number | null>(null);
const maoVoiceSpeaker = ref<number>(3);
const hiyori = ref<string>('Hiyori');
const hiyoriHomeDir = computed<string>(() => `/Resources/${hiyori.value}/`);
const hiyoriFileName = computed<string>(() => `${hiyori.value}.model3.json`);
const hiyoriText = ref<string>('');
const hiyoriMotionGroupName = ref<string | null>(null);
const hiyoriMotionIndex = ref<number | null>(null);
const hiyoriExpressionIndex = ref<number | null>(null);
const hiyoriVoiceSpeaker = ref<number>(2);


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
    character: '',
    text: 'クリックすると次のセリフに進みます。',
    speaker: 0,
    motionGroupName: null,
    motionIndex: null,
    expressionIndex: null,
  },
  {
    character: mao.value,
    text: 'ねえねえ、今日は魔法の実験に付き合ってくれない？新しい呪文を考えたんだ！',
    speaker: maoVoiceSpeaker.value,
    motionGroupName: 'TapBody',
    motionIndex: 1,
    expressionIndex: 3,
  },
  {
    character: hiyori.value,
    text: 'また？前回の実験で教室が虹色になって、先生に怒られたばかりなのに...',
    speaker: hiyoriVoiceSpeaker.value,
    motionGroupName: 'Idle',
    motionIndex: 5,
    expressionIndex: null,
  },
  {
    character: mao.value,
    text: '大丈夫、大丈夫！今回はもっと小さな魔法だから。それに、成功したら宿題を手伝ってあげるよ！',
    speaker: maoVoiceSpeaker.value,
    motionGroupName: 'TapBody',
    motionIndex: 2,
    expressionIndex: 1,
  },
  {
    character: hiyori.value,
    text: '約束する？本当に危なくないの？',
    speaker: hiyoriVoiceSpeaker.value,
    motionGroupName: 'Idle',
    motionIndex: 7,
    expressionIndex: null,
  },
  {
    character: mao.value,
    text: 'もちろん！...たぶん。ほら、この青い瓶と緑の液体を混ぜるだけだから。何も起こらなかったら、おやつをおごるよ！',
    speaker: maoVoiceSpeaker.value,
    motionGroupName: 'Idle',
    motionIndex: 0,
    expressionIndex: 6,
  },
  {
    character: hiyori.value,
    text: 'はぁ...わかったわ。でも今度変なことになったら、一緒に謝りに行くからね？',
    speaker: hiyoriVoiceSpeaker.value,
    motionGroupName: 'Idle',
    motionIndex: 8,
    expressionIndex: null,
  },
  {
    character: mao.value,
    text: 'やった！それじゃあ、準備して...魔法の時間、始まるよ！',
    speaker: maoVoiceSpeaker.value,
    motionGroupName: 'TapBody',
    motionIndex: 3,
    expressionIndex: null,
  },
]);
const currentTextIndex = ref<number>(0);
const currentText = computed(() => novelGameTexts.value[currentTextIndex.value]);
const currentCharIndex = ref<number>(0);
const currentChars = computed(() => currentText.value.text.slice(0, currentCharIndex.value));
watch(currentTextIndex, () => {
  currentCharIndex.value = 0
});
watch(currentText, () => {
  if (currentText.value.character === mao.value) {
    maoText.value = currentText.value.text;
    maoMotionGroupName.value = currentText.value.motionGroupName ?? 'Idle';
    maoMotionIndex.value = currentText.value.motionIndex ?? 0;
    maoExpressionIndex.value = currentText.value.expressionIndex ?? 0;
  } else if (currentText.value.character === hiyori.value) {
    hiyoriText.value = currentText.value.text;
    hiyoriMotionGroupName.value = currentText.value.motionGroupName ?? 'Idle';
    hiyoriMotionIndex.value = currentText.value.motionIndex ?? 0;
    hiyoriExpressionIndex.value = currentText.value.expressionIndex ?? 0;
  }
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
      <h2 class="text-gray-600 dark:text-gray-200 text-xl py-4">ノベルゲーム風</h2>
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
                  <VCubismModelAssetsProvider :model-home-dir="maoHomeDir" :model-file-name="maoFileName">
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
                      <VVoicevoxLipsync v-if="currentText.character === mao" :speaker="currentText.speaker"
                        :text="currentText.text" :speed-scale="1.2" />
                    </VCubismUpdateModel>
                    <!-- モデル座標設定用の行列を提供 -->
                    <VCubismModelMatrixProvider :scaleX="3" :scaleY="3" :translateX="-0.6" :translateY="-0.95">
                      <!-- モデルのレンダー処理 -->
                      <VCubismModelAssetsRenderer :z-index="currentText.character === mao ? 1 : 0" />
                    </VCubismModelMatrixProvider>
                    <!-- モーションを管理するコンポーネント -->
                    <VCubismMotionManager :group="maoMotionGroupName" :index="maoMotionIndex" :loop="false" />
                    <!-- 表情を管理するコンポーネント -->
                    <VCubismExpressionManager :index="maoExpressionIndex" />
                  </VCubismModelAssetsProvider>

                  <!-- モデルアセットを読み込み提供 -->
                  <VCubismModelAssetsProvider :model-home-dir="hiyoriHomeDir" :model-file-name="hiyoriFileName">
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
                      <VVoicevoxLipsync v-if="currentText.character === hiyori" :speaker="currentText.speaker"
                        :text="currentText.text" :speed-scale="1.2" />
                    </VCubismUpdateModel>
                    <!-- モデル座標設定用の行列を提供 -->
                    <VCubismModelMatrixProvider :scaleX="3" :scaleY="3" :translateX="0.6" :translateY="-0.9">
                      <!-- モデルのレンダー処理 -->
                      <VCubismModelAssetsRenderer :z-index="currentText.character === hiyori ? 1 : 0" />
                    </VCubismModelMatrixProvider>
                    <!-- モーションを管理するコンポーネント -->
                    <VCubismMotionManager :group="hiyoriMotionGroupName" :index="hiyoriMotionIndex" :loop="false" />
                    <!-- 表情を管理するコンポーネント -->
                    <VCubismExpressionManager :index="hiyoriExpressionIndex" />
                  </VCubismModelAssetsProvider>
                </VCubismViewMatrixProvider>
              </VCubismProjectionMatrixProvider>
            </VCubismRenderLoopProvider>
          </VCubismCanvasWebGLProvider>
        </VCubismFramework>
        <div class="absolute bottom-0 left-0 right-0 px-4 py-2 bg-blue-950/90 bg-opacity-50 h-32">
          <p class="text-gray-200 pb-2">{{ currentText.character }}</p>
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
