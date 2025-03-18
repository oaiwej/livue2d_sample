<script setup lang="ts">
import VCubismCanvasWebGLProvider from '@/live2d/components/VCubismCanvasWebGLProvider.vue';
import VCubismExpressionManager from '@/live2d/components/VCubismExpressionManager.vue';
import VCubismFramework from '@/live2d/components/VCubismFramework.vue';
import VCubismHitAreaRenderer from '@/live2d/components/VCubismHitAreaRenderer.vue';
import VCubismHitManager, { type CubismHitEvent } from '@/live2d/components/VCubismHitManager.vue';
import VCubismModelAssetsProvider, { type CubismModelAssets } from '@/live2d/components/VCubismModelAssetsProvider.vue';
import VCubismModelAssetsRenderer from '@/live2d/components/VCubismModelAssetsRenderer.vue';
import VCubismModelMatrixProvider from '@/live2d/components/VCubismModelMatrixProvider.vue';
import VCubismMotionManager from '@/live2d/components/VCubismMotionManager.vue';
import VCubismProjectionMatrixProvider from '@/live2d/components/VCubismProjectionMatrixProvider.vue';
import VCubismRenderLoopProvider from '@/live2d/components/VCubismRenderLoopProvider.vue';
import VCubismUpdateModel from '@/live2d/components/VCubismUpdateModel.vue';
import VCubismUpdateModelBreath from '@/live2d/components/VCubismUpdateModelBreath.vue';
import VCubismUpdateModelExpression from '@/live2d/components/VCubismUpdateModelExpression.vue';
import VCubismUpdateModelEyeBlink from '@/live2d/components/VCubismUpdateModelEyeBlink.vue';
import VCubismUpdateModelMotion from '@/live2d/components/VCubismUpdateModelMotion.vue';
import VCubismUpdateModelPhysics from '@/live2d/components/VCubismUpdateModelPhysics.vue';
import VCubismViewMatrixProvider from '@/live2d/components/VCubismViewMatrixProvider.vue';
import { getExpressionList } from '@/live2d/utils/getExpressionList';
import { getMotionCollection } from '@/live2d/utils/getMotionCollection';
import { computed, ref } from 'vue';

const ModelDir: string[] = [
  'Haru',
  'Hiyori',
  'Mark',
  'Natori',
  'Rice',
  'Mao',
  'Wanko'
];

// 現在選択されているモデル名
const selectedModel = ref<string>('Mao');

// モデルのホームディレクトリとファイル名を定義
const modelHomeDir = computed<string>(() => `/Resources/${selectedModel.value}/`);
const modelFileName = computed<string>(() => `${selectedModel.value}.model3.json`);

// 全てのモーションを保持するリスト
const motionCollection = ref<ReturnType<typeof getMotionCollection>>({});
// 現在選択されているモーショングループ名
const motionGroupName = ref<string>('Idle');
const proxyMotionGroupName = computed<string>({
  get: () => motionGroupName.value,
  set: (value: string) => {
    motionGroupName.value = value;
    motionIndex.value = 0;
  },
});
// 現在選択されているモーションのインデックス
const motionIndex = ref<number | null>(0);
// ユニークなモーショングループ名のリストを計算
const motionGroupNames = computed(() => Object.keys(motionCollection.value));
// 選択されたモーショングループのモーションリストを計算
const currentGroupMotions = computed(() => {
  return motionCollection.value[motionGroupName.value] || [];
});

// 表情のリスト
const expressionList = ref<ReturnType<typeof getExpressionList>>([]);
// 現在選択されている表情
const expressionIndex = ref<number | null>(null);

// モデルの拡大縮小と移動用の変数
const scale = ref<number | string>(1.2);
const translateX = ref<number | string>(0);
const translateY = ref<number | string>(0);

/**
 * モデルを変更する処理
 * @param modelName - 選択されたモデル名
 */
function changeModel(modelName: string) {
  selectedModel.value = modelName;
  // モデル変更時にモーションリストをリセット
  motionCollection.value = {};
  motionGroupName.value = 'Idle';
  motionIndex.value = 0;
}

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

  // モーションリストを取得
  motionCollection.value = getMotionCollection(assets.modelSetting);

  // 表情リストをロード
  expressionList.value = getExpressionList(assets.modelSetting);
}

const text = ref<string>(``);
const textResetTimeoutId = ref<ReturnType<typeof setTimeout> | null>(null);
function onHit(event: CubismHitEvent) {
  text.value = `${event.hitAreaName}をクリックしました。`;
  if (textResetTimeoutId.value) {
    clearTimeout(textResetTimeoutId.value);
  }
  textResetTimeoutId.value = setTimeout(() => {
    text.value = '';
  }, 1000);
}

const showHitBox = ref<boolean>(false);
</script>

<template>
  <section>
    <header class="pb-4">
      <h2 class="text-gray-600 dark:text-gray-200 text-xl py-4">Live2Dのサンプルアセット・ギャラリー</h2>
      <p class="text-gray-500 dark:text-gray-400">
        Live2Dのサンプルアセットを表示し、モーションや表情を確認できます。
      </p>
    </header>
  </section>
  <div class="character-container flex flex-col md:flex-row gap-4">
    <div class="rounded-lg overflow-hidden relative">
      <Transition>
        <div v-if="text" class="absolute top-1 left-1 text-white">
          {{ text }}
        </div>
      </Transition>
      <!-- フレームワーク初期化 -->
      <VCubismFramework>
        <!-- WebGL描画用のCanvasをマウントし、WebGLコンテキストを提供 -->
        <VCubismCanvasWebGLProvider class="w-full" style="aspect-ratio: 9/16;" width="720" height="1280">
          <!-- プロジェクション行列を提供 -->
          <VCubismProjectionMatrixProvider>
            <!-- ViewMatrixを提供 -->
            <VCubismViewMatrixProvider>
              <!-- 描画ループを提供 -->
              <VCubismRenderLoopProvider :fps="30">
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
                  </VCubismUpdateModel>
                  <!-- モデル座標設定用の行列を提供 -->
                  <VCubismModelMatrixProvider :scale-x="Number(scale)" :scale-y="Number(scale)"
                    :translate-x="Number(translateX)" :translate-y="Number(translateY)">
                    <!-- モデルのレンダー処理 -->
                    <VCubismModelAssetsRenderer />
                    <VCubismHitAreaRenderer v-if="showHitBox" />
                    <VCubismHitManager @hit="onHit" />
                  </VCubismModelMatrixProvider>
                  <!-- モーションを管理するコンポーネント -->
                  <VCubismMotionManager :group="motionGroupName" :index="motionIndex" :loop="true" />
                  <!-- 表情を管理するコンポーネント -->
                  <VCubismExpressionManager :index="expressionIndex" />
                </VCubismModelAssetsProvider>
              </VCubismRenderLoopProvider>
            </VCubismViewMatrixProvider>
          </VCubismProjectionMatrixProvider>
        </VCubismCanvasWebGLProvider>
      </VCubismFramework>
    </div>
    <div class="controls flex flex-col gap-2">
      <!-- モデル選択用のUIコンポーネント -->
      <div class="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 gap-4">
        <div class="flex flex-col space-y-2">
          <label for="modelSelect" class="text-gray-700 dark:text-gray-300">Character Model</label>
          <select id="modelSelect" v-model="selectedModel" @change="changeModel(selectedModel)"
            class="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            <option v-for="model in ModelDir" :key="model" :value="model">
              {{ model }}
            </option>
          </select>
        </div>
      </div>
      <!-- モーション制御用のUIコンポーネント -->
      <div class="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 gap-4">
        <div class="flex flex-col space-y-2">
          <label for="motionGroup" class="text-gray-700 dark:text-gray-300">Motion Group</label>
          <select id="motionGroup" v-model="proxyMotionGroupName" @change="motionIndex = 0"
            class="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            <option v-for="groupName in motionGroupNames" :key="groupName" :value="groupName">
              {{ groupName }}
            </option>
          </select>
        </div>
        <div class="flex flex-col space-y-2">
          <label for="motionIndex" class="text-gray-700 dark:text-gray-300">Motion</label>
          <select id="motionIndex" v-model="motionIndex"
            class="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            <option :value="null">Stop</option>
            <option v-for="motion in currentGroupMotions" :key="motion.filename" :value="motion.index">
              {{ motion.filename }}
            </option>
          </select>
        </div>
      </div>
      <!-- 表情制御用のUIコンポーネント -->
      <div class="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 gap-4">
        <div class="flex flex-col space-y-2">
          <label for="expression" class="text-gray-700 dark:text-gray-300">Expression</label>
          <select id="expression" v-model="expressionIndex"
            class="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            <option :value="null">None</option>
            <option v-for="expression in expressionList" :key="expression.index" :value="expression.index">
              {{ expression.name }}
            </option>
          </select>
        </div>
      </div>
      <!-- モデルの拡大縮小と移動用のUIコンポーネント -->
      <div class="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 gap-4">
        <div class="flex flex-col space-y-2">
          <label for="scale" class="text-gray-700 dark:text-gray-300">Scale: {{ scale }}</label>
          <input id="scale" type="range" v-model="scale" min="0.5" max="3" step="0.1"
            class="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300" />
        </div>
        <div class="flex flex-col space-y-2">
          <label for="translateX" class="text-gray-700 dark:text-gray-300">Translate X: {{ translateX }}</label>
          <input id="translateX" type="range" v-model="translateX" min="-1" max="1" step="0.1"
            class="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300" />
        </div>
        <div class="flex flex-col space-y-2">
          <label for="translateY" class="text-gray-700 dark:text-gray-300">Translate Y: {{ translateY }}</label>
          <input id="translateY" type="range" v-model="translateY" min="-1" max="1" step="0.1"
            class="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300" />
        </div>
      </div>
      <!-- ヒットエリア表示用のUIコンポーネント -->
      <div class="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 gap-4">
        <div class="flex flex-row-reverse justify-center items-center gap-2">
          <label for="displayHitArea" class="text-gray-700 dark:text-gray-300">Display Hit Area</label>
          <input id="displayHitArea" type="checkbox" v-model="showHitBox"
            class="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 w-4 h-4" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* これらのクラスが何をするかは後ほど説明します! */
.v-enter-active {
  transition: opacity 0.2s ease-out;
}

.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.controls {
  width: 100%;
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 8px;
}
</style>
