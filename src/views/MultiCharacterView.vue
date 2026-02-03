<script setup lang="ts">
import VVoicevoxLipsync from '@/livue2d/components/VVoicevoxLipsync.vue';
import VCubismCanvasWebGLProvider from '@/livue2d/live2d/components/VCubismCanvasWebGLProvider.vue';
import VCubismFramework from '@/livue2d/live2d/components/VCubismFramework.vue';
import VCubismHitManager from '@/livue2d/live2d/components/VCubismHitManager.vue';
import VCubismModelAssetsProvider from '@/livue2d/live2d/components/VCubismModelAssetsProvider.vue';
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
import { AudioPlayer } from '@/livue2d/utils/audio/AudioPlayer';
import { requestAudioQueries } from '@/livue2d/utils/voicevox/requestAudioQuery';
import { requestMultiSynthesis } from '@/livue2d/utils/voicevox/requestSynthesis';
import { splitSentence } from '@/livue2d/utils/voicevox/splitSentence';
import type { VoiceVoxAudioQuery } from '@/livue2d/utils/voicevox/type/VoiceVoxAudioQuery';
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue';

class Character {
  name = ref<string>('');
  nameJapanese = ref<string>('');
  homeDir = computed<string>(() => `/Resources/${this.name.value}/`);
  fileName = computed<string>(() => `${this.name.value}.model3.json`);
  text = ref<string>('');
  motionGroupName = ref<string>('Idle');
  motionIndex = ref<number>(0);
  voiceSpeaker = ref<number>(0);
  audioQueries = ref<VoiceVoxAudioQuery[]>([]);
  audioPlayer = ref<AudioPlayer>(new AudioPlayer());
  x = ref<number>(0);
  y = ref<number>(0);
  scale = ref<number>(1);
  touchMotionGroupName = ref<string>('TapBody');
  touchMotionIndex = ref<number>(0);
  /**
   * キャラクターをタップしたときの処理
   */
  async onHit() {
    this.text.value = `こんにちは、私は${this.nameJapanese.value}です。`;
    const audioQueries = await requestAudioQueries(splitSentence(this.text.value), this.voiceSpeaker.value);
    const validQueries = audioQueries.filter(q => q.accent_phrases.length > 0);
    for (const query of validQueries) {
      query.speedScale = 1.2;
    }
    const buffers = await requestMultiSynthesis(validQueries, this.voiceSpeaker.value);
    await this.audioPlayer.value.prepare(buffers)
    this.audioQueries.value = validQueries;
    this.audioPlayer.value.start(0);
    this.motionGroupName.value = this.touchMotionGroupName.value;
    this.motionIndex.value = this.touchMotionIndex.value;
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
    this.audioPlayer.value.release();
  }


  constructor(
    name: string,
    nameJapanese: string,
    options: {
      x?: number,
      y?: number,
      scale?: number,
      voiceSpeaker?: number,
      touchMotionGroupName?: string,
      touchMotionIndex?: number,
    } = {}) {
    this.name.value = name;
    this.nameJapanese.value = nameJapanese;
    this.audioPlayer.value.onended = () => {
      this.onSpeakEnded();
    };
    this.x.value = options.x ?? this.x.value;
    this.y.value = options.y ?? this.y.value;
    this.scale.value = options.scale ?? this.scale.value;
    this.voiceSpeaker.value = options.voiceSpeaker ?? this.voiceSpeaker.value;
    this.touchMotionGroupName.value = options.touchMotionGroupName ?? this.touchMotionGroupName.value;
    this.touchMotionIndex.value = options.touchMotionIndex ?? this.touchMotionIndex.value;
  }
}

const mao = shallowRef<Character>(new Character('Mao', 'マオ', {
  x: -0.7,
  y: -0.9,
  scale: 3,
  voiceSpeaker: 1,
  touchMotionGroupName: 'TapBody',
  touchMotionIndex: 2
}));

const hiyori = shallowRef<Character>(new Character('Hiyori', 'ヒヨリ', {
  x: 0.7,
  y: -0.9,
  scale: 3,
  voiceSpeaker: 0,
  touchMotionGroupName: 'TapBody',
  touchMotionIndex: 0
}));

const characters = shallowRef<Character[]>([mao.value, hiyori.value]);

onBeforeUnmount(() => {
  for (const character of characters.value) {
    character.releaseAudio();
  }
});
</script>

<template>
  <section>
    <header class="pb-4">
      <h2 class="py-4">複数のキャラクター</h2>
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
                  <VCubismModelAssetsProvider v-for="character in characters" :key="character.name.value"
                    :model-home-dir="character.homeDir.value" :model-file-name="character.fileName.value">
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
                      <VVoicevoxLipsync :audio-queries="character.audioQueries.value"
                        @ended="character.onSpeakEnded()" />
                    </VCubismUpdateModel>
                    <!-- モデル座標設定用の行列を提供 -->
                    <VCubismModelMatrixProvider :scaleX="character.scale.value" :scaleY="character.scale.value"
                      :translateX="character.x.value" :translateY="character.y.value">
                      <!-- モデルのレンダー処理 -->
                      <VCubismModelAssetsRenderer />
                      <VCubismHitManager @hit="character.onHit()" />
                    </VCubismModelMatrixProvider>
                    <!-- モーションを管理するコンポーネント -->
                    <VCubismMotionManager :group="character.motionGroupName.value" :index="character.motionIndex.value"
                      :loop="character.motionGroupName.value === 'Idle'"
                      @motion-finished="character.motionGroupName.value = 'Idle'; character.motionIndex.value = 0;" />
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
