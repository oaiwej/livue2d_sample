<script setup lang="ts">
import VVoicevoxLipsync from '@/components/VVoicevoxLipsync.vue';
import VCubismCanvasWebGLProvider from '@/live2d/components/VCubismCanvasWebGLProvider.vue';
import VCubismFramework from '@/live2d/components/VCubismFramework.vue';
import VCubismHitManager from '@/live2d/components/VCubismHitManager.vue';
import VCubismModelAssetsProvider from '@/live2d/components/VCubismModelAssetsProvider.vue';
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
import { computed, ref } from 'vue';

const mao = ref<string>('Mao');
const maoHomeDir = computed<string>(() => `/Resources/${mao.value}/`);
const maoFileName = computed<string>(() => `${mao.value}.model3.json`);
const maoText = ref<string>('');
const maoMotionGroupName = ref<string>('Idle');
const maoMotionIndex = ref<number>(0);
const maoVoiceSpeaker = ref<number>(1);
const hiyori = ref<string>('Hiyori');
const hiyoriHomeDir = computed<string>(() => `/Resources/${hiyori.value}/`);
const hiyoriFileName = computed<string>(() => `${hiyori.value}.model3.json`);
const hiyoriText = ref<string>('');
const hiyoriMotionGroupName = ref<string>('Idle');
const hiyoriMotionIndex = ref<number>(0);
const hiyoriVoiceSpeaker = ref<number>(0);

function onHitMao() {
  maoText.value = 'こんにちは、私はマオです。';
  maoMotionGroupName.value = 'TapBody';
  maoMotionIndex.value = 2;
}
function onMaoVoiceEnded() {
  maoText.value = '';
}

function onHitHiyori() {
  hiyoriText.value = 'こんにちは、私はヒヨリです。';
  hiyoriMotionGroupName.value = 'TapBody';
  hiyoriMotionIndex.value = 0;
}
function onHiyoriVoiceEnded() {
  hiyoriText.value = '';
}
</script>

<template>
  <section>
    <header class="pb-4">
      <h2 class="text-gray-600 dark:text-gray-200 text-xl py-4">複数のキャラクター</h2>
      <p class="text-gray-500 dark:text-gray-400">
        一つのCanvasにキャラクターを複数表示し、タップするとそれぞれのキャラクターが反応します。
      </p>
    </header>
    <div class="character-container flex flex-col md:flex-row gap-4">
      <div class="rounded-lg overflow-hidden">
        <!-- フレームワーク初期化 -->
        <VCubismFramework>
          <!-- WebGL描画用のCanvasをマウントし、WebGLコンテキストを提供 -->
          <VCubismCanvasWebGLProvider class="w-full aspect-video" width="1280" height="720">
            <!-- プロジェクション行列を提供 -->
            <VCubismProjectionMatrixProvider>
              <!-- ViewMatrixを提供 -->
              <VCubismViewMatrixProvider>
                <!-- 描画ループを提供 -->
                <VCubismRenderLoopProvider :fps="30">
                  <!-- モデルアセットを読み込み提供 -->
                  <VCubismModelAssetsProvider :model-home-dir="maoHomeDir" :model-file-name="maoFileName">
                    <!-- モデルの更新処理 -->
                    <VCubismUpdateModel>
                      <!-- モーションの更新処理 -->
                      <VCubismUpdateModelMotion>
                        <VCubismUpdateModelEyeBlink />
                      </VCubismUpdateModelMotion>
                      <!-- ブレスの更新処理 -->
                      <VCubismUpdateModelBreath />
                      <!-- 物理演算の更新処理 -->
                      <VCubismUpdateModelPhysics />
                      <!-- 表情の更新処理 -->
                      <VCubismUpdateModelExpression />
                      <!-- 音声合成とリップシンク -->
                      <VVoicevoxLipsync :speaker="maoVoiceSpeaker" :text="maoText" @ended="onMaoVoiceEnded" />
                    </VCubismUpdateModel>
                    <!-- モデル座標設定用の行列を提供 -->
                    <VCubismModelMatrixProvider :scaleX="3" :scaleY="3" :translateX="-0.7" :translateY="-0.9">
                      <!-- モデルのレンダー処理 -->
                      <VCubismModelAssetsRenderer />
                      <VCubismHitManager @hit="onHitMao" />
                    </VCubismModelMatrixProvider>
                    <!-- モーションを管理するコンポーネント -->
                    <VCubismMotionManager :group="maoMotionGroupName" :index="maoMotionIndex"
                      :loop="maoMotionGroupName === 'Idle'"
                      @motion-finished="maoMotionGroupName = 'Idle'; maoMotionIndex = 0;" />
                    <!-- 表情を管理するコンポーネント -->
                    <!-- <VCubismExpressionManager :index="expressionIndex" /> -->
                  </VCubismModelAssetsProvider>

                  <!-- モデルアセットを読み込み提供 -->
                  <VCubismModelAssetsProvider :model-home-dir="hiyoriHomeDir" :model-file-name="hiyoriFileName">
                    <!-- モデルの更新処理 -->
                    <VCubismUpdateModel>
                      <!-- モーションの更新処理 -->
                      <VCubismUpdateModelMotion>
                        <VCubismUpdateModelEyeBlink />
                        <VCubismUpdateModelBreath />
                        <VCubismUpdateModelPhysics />
                      </VCubismUpdateModelMotion>
                      <!-- 表情の更新処理 -->
                      <VCubismUpdateModelExpression />
                      <VVoicevoxLipsync :speaker="hiyoriVoiceSpeaker" :text="hiyoriText" @ended="onHiyoriVoiceEnded" />
                    </VCubismUpdateModel>
                    <!-- モデル座標設定用の行列を提供 -->
                    <VCubismModelMatrixProvider :scaleX="3" :scaleY="3" :translateX="0.7" :translateY="-0.9">
                      <!-- モデルのレンダー処理 -->
                      <VCubismModelAssetsRenderer />
                      <VCubismHitManager @hit="onHitHiyori" />
                    </VCubismModelMatrixProvider>
                    <!-- モーションを管理するコンポーネント -->
                    <VCubismMotionManager :group="hiyoriMotionGroupName" :index="hiyoriMotionIndex"
                      :loop="hiyoriMotionGroupName === 'Idle'"
                      @motion-finished="hiyoriMotionGroupName = 'Idle'; hiyoriMotionIndex = 0;" />
                    <!-- 表情を管理するコンポーネント -->
                    <!-- <VCubismExpressionManager :index="expressionIndex" /> -->
                  </VCubismModelAssetsProvider>
                </VCubismRenderLoopProvider>
              </VCubismViewMatrixProvider>
            </VCubismProjectionMatrixProvider>
          </VCubismCanvasWebGLProvider>
        </VCubismFramework>
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
