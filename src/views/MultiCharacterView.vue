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
import { WavFileReader } from '@/utils/audio/WavFileReader';
import { WavFileWriter } from '@/utils/audio/WavFileWriter';
import { requestAudioQueries } from '@/utils/voicevox/requestAudioQuery';
import { requestMultiSynthesis } from '@/utils/voicevox/requestSynthesis';
import { splitSentence } from '@/utils/voicevox/splitSentence';
import type { VoiceVoxAudioQuery } from '@/utils/voicevox/type/VoiceVoxAudioQuery';
import { computed, ref, shallowRef } from 'vue';

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
  audio = shallowRef<HTMLAudioElement>(new Audio());
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
    this.audioQueries.value = await requestAudioQueries(splitSentence(this.text.value), this.voiceSpeaker.value);
    for (const query of this.audioQueries.value) {
      query.speedScale = 1.2;
    }
    const buffers = await requestMultiSynthesis(this.audioQueries.value, this.voiceSpeaker.value);
    const waves = buffers.map((buffer) => new WavFileReader(buffer));
    const wav = new WavFileWriter(waves[0].getFormat());
    wav.append(waves)
    this.releaseAudio();
    this.audio.value.src = URL.createObjectURL(new Blob([wav.getBuffer()], { type: 'audio/wav' }));
    this.audio.value.play();
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
      touchMotionGroupName?: string,
      touchMotionIndex?: number,
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
