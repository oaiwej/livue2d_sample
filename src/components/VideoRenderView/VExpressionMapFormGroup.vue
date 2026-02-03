<template>
  <div class="flex flex-col lg:flex-row gap-2">
    <div class="flex-1">
      <!-- フレームワーク初期化 -->
      <VCubismFramework>
        <!-- WebGL描画用のCanvasをマウントし、WebGLコンテキストを提供 -->
        <VCubismCanvasWebGLProvider class="w-full"
          :style="{ 'aspect-ratio': `${viewSetting.canvasWidth}/${viewSetting.canvasHeight}` }"
          :width="viewSetting.canvasWidth" :height="viewSetting.canvasHeight">
          <!-- プロジェクション行列を提供 -->
          <VCubismProjectionMatrixProvider>
            <!-- ViewMatrixを提供 -->
            <VCubismViewMatrixProvider>
              <!-- 描画ループを提供 -->
              <VCubismRenderLoopProvider :fps="viewSetting.framerate ?? 30">
                <!-- モデルアセットを読み込み提供 -->
                <VCubismModelAssetsProvider :model-home-dir="modelHomeDir" :model-file-name="modelFileName"
                  @loaded="onAssetsLoaded">
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
                  <VCubismModelMatrixProvider :scale-x="viewSetting.scale" :scale-y="viewSetting.scale"
                    :translate-x="viewSetting.translateX" :translate-y="viewSetting.translateY">
                    <!-- モデルのレンダー処理 -->
                    <VCubismModelAssetsRenderer />
                  </VCubismModelMatrixProvider>
                  <!-- モーションを管理するコンポーネント -->
                  <VCubismMotionManager :group="currentMotionGroupName" :index="currentMotionIndex" :loop="true" />
                  <!-- 表情を管理するコンポーネント -->
                  <VCubismExpressionManager :index="currentExpressionIndex" />
                </VCubismModelAssetsProvider>
              </VCubismRenderLoopProvider>
            </VCubismViewMatrixProvider>
          </VCubismProjectionMatrixProvider>
        </VCubismCanvasWebGLProvider>
      </VCubismFramework>
    </div>
    <div class="flex-1 flex-col gap-4">
      <div class="flex flex-col gap-2 pb-4">
        <div class="grid grid-cols-[1fr_1fr_1fr] gap-x-2">
          <div class="flex flex-col gap-2">
            <label class="text-sm">Canvas Width</label>
            <input type="number" v-model="viewSetting.canvasWidth" required aria-required="true" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm">Canvas Height</label>
            <input type="number" v-model="viewSetting.canvasHeight" required aria-required="true" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm">Framerate</label>
            <VNumericInput type="number" v-model="viewSetting.framerate" :min="1" :max="60" :step="1" required
              aria-required="true" />
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-2 pb-4">
        <label class="text-sm">モデル</label>
        <select v-model="model" required aria-required="true">
          <option v-for="name in ModelNames" :key="name" :value="name">
            {{ name }}
          </option>
        </select>
      </div>
      <div class="flex flex-col gap-2 pb-4">
        <div class="grid grid-cols-[1fr_1fr_1fr] gap-x-2">
          <div class="flex flex-col gap-2">
            <label class="text-sm">Scale: {{ viewSetting.scale }}</label>
            <VNumericInput type="range" :min="0.1" :max="5.0" :step="0.1" v-model="viewSetting.scale" required
              aria-required="true" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm">Translate X: {{ viewSetting.translateX }}</label>
            <VNumericInput type="range" :min="-3.0" :max="3.0" :step="0.1" v-model="viewSetting.translateX" required
              aria-required="true" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm">Translate Y: {{ viewSetting.translateY }}</label>
            <VNumericInput type="range" :min="-3.0" :max="3.0" :step="0.1" v-model="viewSetting.translateY" required
              aria-required="true" />
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-2 pb-4">
        <label class="text-sm">表情マップ</label>
        <div class="grid grid-cols-[1fr_1fr_2fr_1fr] gap-y-2 gap-x-1">
          <template v-for="expressionType in EXPRESSION_TYPES.filter(e => e !== 'auto')" :key="expressionType">
            <div class="flex flex-col justify-center">{{ expressionType }}</div>
            <select v-model="expressionMap[expressionType].motionGroupName"
              @focus="setExpression(expressionMap[expressionType])"
              @change="setExpression(expressionMap[expressionType])" required aria-required="true">
              <option v-for="name in motionsGroupNames" :key="name" :value="name">
                {{ name }}
              </option>
            </select>
            <select v-model="expressionMap[expressionType].motionIndex"
              @focus="setExpression(expressionMap[expressionType])"
              @change="setExpression(expressionMap[expressionType])" required aria-required="true">
              <option v-for="motion in (motionCollection ?? {})[expressionMap[expressionType].motionGroupName]"
                :key="motion.filename" :value="motion.index">
                {{ motion.filename }}
              </option>
            </select>
            <select v-model="expressionMap[expressionType].expressionIndex"
              @focus="setExpression(expressionMap[expressionType])"
              @change="setExpression(expressionMap[expressionType])">
              <option :value="null">None</option>
              <option v-for="expression in expressionCollection ?? []" :key="expression.index"
                :value="expression.index">
                {{ expression.name }}
              </option>
            </select>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import VNumericInput from '@/components/ui/VNumericInput.vue';
import VCubismCanvasWebGLProvider from '@/livue2d/live2d/components/VCubismCanvasWebGLProvider.vue';
import VCubismExpressionManager from '@/livue2d/live2d/components/VCubismExpressionManager.vue';
import VCubismFramework from '@/livue2d/live2d/components/VCubismFramework.vue';
import VCubismModelAssetsProvider, { type CubismModelAssets } from '@/livue2d/live2d/components/VCubismModelAssetsProvider.vue';
import VCubismModelAssetsRenderer from '@/livue2d/live2d/components/VCubismModelAssetsRenderer.vue';
import VCubismModelMatrixProvider from '@/livue2d/live2d/components/VCubismModelMatrixProvider.vue';
import VCubismMotionManager from '@/livue2d/live2d/components/VCubismMotionManager.vue';
import VCubismProjectionMatrixProvider from '@/livue2d/live2d/components/VCubismProjectionMatrixProvider.vue';
import VCubismRenderLoopProvider from '@/livue2d/live2d/components/VCubismRenderLoopProvider.vue';
import VCubismUpdateModel from '@/livue2d/live2d/components/VCubismUpdateModel.vue';
import VCubismUpdateModelBreath from '@/livue2d/live2d/components/VCubismUpdateModelBreath.vue';
import VCubismUpdateModelExpression from '@/livue2d/live2d/components/VCubismUpdateModelExpression.vue';
import VCubismUpdateModelEyeBlink from '@/livue2d/live2d/components/VCubismUpdateModelEyeBlink.vue';
import VCubismUpdateModelMotion from '@/livue2d/live2d/components/VCubismUpdateModelMotion.vue';
import VCubismUpdateModelPhysics from '@/livue2d/live2d/components/VCubismUpdateModelPhysics.vue';
import VCubismViewMatrixProvider from '@/livue2d/live2d/components/VCubismViewMatrixProvider.vue';
import { getExpressionList } from '@/livue2d/live2d/utils/getExpressionList';
import { getMotionCollection } from '@/livue2d/live2d/utils/getMotionCollection';
import { DEFAULT_EXPRESSION_MAP, type ExpressionMap, type ExpressionMapValue } from '@/livue2d/utils/app/type/ExpressionMap';
import { EXPRESSION_TYPES } from '@/livue2d/utils/app/type/ExpressionType';
import type { ViewSetting } from '@/livue2d/utils/app/type/ViewSetting';
import { computed, ref } from 'vue';


const ModelNames: string[] = [
  'Haru',
  'Hiyori',
  'Mark',
  'Natori',
  'Rice',
  'Mao',
  'Wanko'
] as const;

const model = defineModel<string>('model', {
  default: 'Mao',
})

const modelHomeDir = computed<string>(() => `/Resources/${model.value}/`);
const modelFileName = computed<string>(() => `${model.value}.model3.json`);
const motionCollection = ref<ReturnType<typeof getMotionCollection> | null>(null);
const motionsGroupNames = computed(() => Object.keys(motionCollection.value ?? {}));
const expressionCollection = ref<ReturnType<typeof getExpressionList> | null>(null);
const currentMotionGroupName = ref<string | null>(null);
const currentMotionIndex = ref<number | null>(null);
const currentExpressionIndex = ref<number | null>(null);
const viewSetting = defineModel<ViewSetting>('viewSetting', {
  default: () => ({
    canvasWidth: 1024,
    canvasHeight: 1024,
    framerate: 30,

    scale: 3,
    translateX: 0,
    translateY: -0.9,
  })
})
const expressionMap = defineModel<ExpressionMap>('expressionMap', {
  default: () => {
    return structuredClone(DEFAULT_EXPRESSION_MAP);
  }
})

function onAssetsLoaded(assets: CubismModelAssets) {
  if (!assets.modelSetting) {
    console.error('モデルのアセットが見つかりません');
    return;
  }
  // モーションコレクションを取得
  motionCollection.value = getMotionCollection(assets.modelSetting);
  expressionCollection.value = getExpressionList(assets.modelSetting);
}

function setExpression(exp: ExpressionMapValue) {
  currentMotionGroupName.value = exp.motionGroupName;
  currentMotionIndex.value = exp.motionIndex;
  currentExpressionIndex.value = exp.expressionIndex;
}
</script>

<style scoped></style>
