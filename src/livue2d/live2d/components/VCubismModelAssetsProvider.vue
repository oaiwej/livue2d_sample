<template>
  <slot v-if="initialized"></slot>
</template>
<script setup lang="ts">
/**
 * VCubismModelAssetsProvider.vue
 *
 * このコンポーネントはLive2Dモデルのアセット管理を担当します。
 * モデルの表示に必要なすべてのリソースの読み込み、初期化、解放を管理し、
 * 他のコンポーネントがこれらのリソースを利用できるようにします。
 *
 * 主な機能:
 * - モデル設定ファイル(.model3.json)の読み込み
 * - MOCファイルやテクスチャなどのモデルリソースの読み込み
 * - 物理演算、表情、モーションなどの動的要素の初期化
 * - WebGLレンダラーの設定と管理
 * - モデル切り替え時の適切なリソース解放と再読み込み
 * - 依存コンポーネントへのアセット提供
 *
 * @props {string} modelHomeDir - モデルファイルが格納されているディレクトリパス
 * @props {string} modelFileName - 読み込むモデルファイル名（.model3.jsonファイル）
 *
 * @emits {('loaded', CubismModelAssets)} - アセットの読み込み完了時に発火するイベント
 */
import { loadCubismExpression } from '@/live2d/model/loadCubismExpression';
import { loadCubismMoc } from '@/live2d/model/loadCubismMoc';
import { loadCubismModel } from '@/live2d/model/loadCubismModel';
import { loadCubismMotion } from '@/live2d/model/loadCubismMotion';
import { loadCubismPhysics } from '@/live2d/model/loadCubismPhysics';
import { loadCubismPose } from '@/live2d/model/loadCubismPose';
import { loadModelSetting } from '@/live2d/model/loadModelSetting';
import { loadUserData } from '@/live2d/model/loadUserData';
import { setupBreath } from '@/live2d/model/setupBreath';
import { setupEyeBlink } from '@/live2d/model/setupEyeBlink';
import { setupEyeBlinkIds } from '@/live2d/model/setupEyeBlinkIds';
import { setupLipsyncIds } from '@/live2d/model/setupLipsyncIds';
import { setupTextures } from '@/live2d/model/setupTextures';
import { logger } from '@/logger';
import type { ICubismModelSetting } from '@framework/icubismmodelsetting';
import { CubismModelMatrix } from '@framework/math/cubismmodelmatrix';
import { CubismMoc } from '@framework/model/cubismmoc';
import { CubismModel } from '@framework/model/cubismmodel';
import { CubismExpressionMotionManager } from '@framework/motion/cubismexpressionmotionmanager';
import { CubismMotionManager } from '@framework/motion/cubismmotionmanager';
import { CubismMotionQueueManager } from '@framework/motion/cubismmotionqueuemanager';
import { CubismRenderer_WebGL } from '@framework/rendering/cubismrenderer_webgl';
import type { csmString } from '@framework/type/csmstring';
import { computed, onBeforeUnmount, onMounted, onUnmounted, provide, ref, shallowRef, watch, type Ref } from 'vue';
import { safeInject } from '../utils/safeInject';
import type { ProvidedWebGLRenderingContext } from './VCubismCanvasWebGLProvider.vue';

const props = defineProps<{
  modelHomeDir: string;
  modelFileName: string;
}>();

/**
 * モデルアセットの状態管理用リアクティブ変数
 * shallowRefを使用して大きなオブジェクトのリアクティビティを最適化
 */
const initialized = ref(false);
const modelSetting = shallowRef<ICubismModelSetting | null>(null);
const moc = shallowRef<CubismMoc | null>(null);
const model = shallowRef<CubismModel | null>(null);
const modelMatrix = shallowRef<CubismModelMatrix | null>(null);
const expressions = shallowRef<Awaited<ReturnType<typeof loadCubismExpression>> | null>(null);
const expressionManager = shallowRef<CubismExpressionMotionManager | null>(null);
const physics = shallowRef<Awaited<ReturnType<typeof loadCubismPhysics>> | null>(null);
const pose = shallowRef<Awaited<ReturnType<typeof loadCubismPose>> | null>(null);
const eyeBlink = shallowRef<Awaited<ReturnType<typeof setupEyeBlink>> | null>(null);
const breath = shallowRef<Awaited<ReturnType<typeof setupBreath>> | null>(null);
const userData = shallowRef<Awaited<ReturnType<typeof loadUserData>> | null>(null);
const eyeBlinkIds = shallowRef<Awaited<ReturnType<typeof setupEyeBlinkIds>> | null>(null);
const lipsyncIds = shallowRef<Awaited<ReturnType<typeof setupLipsyncIds>> | null>(null);
const motions = shallowRef<Awaited<ReturnType<typeof loadCubismMotion>> | null>(null);
const motionManager = shallowRef<CubismMotionManager | null>(null);
const textures = shallowRef<Awaited<ReturnType<typeof setupTextures>> | null>(null);
const renderer = shallowRef<CubismRenderer_WebGL | null>(null);

/**
 * 外部に公開するCubismモデルアセットのインターフェース定義
 * 全てのモデル関連リソースを一括で管理するための構造体
 */
export interface CubismModelAssets {
  modelHomeDir: string;
  modelFileName: string;
  modelSetting?: ICubismModelSetting | null;
  moc?: CubismMoc | null;
  model?: CubismModel | null;
  expressions?: Awaited<ReturnType<typeof loadCubismExpression>> | null;
  expressionManager?: CubismExpressionMotionManager | null;
  physics?: Awaited<ReturnType<typeof loadCubismPhysics>> | null;
  pose?: Awaited<ReturnType<typeof loadCubismPose>> | null;
  eyeBlink?: Awaited<ReturnType<typeof setupEyeBlink>> | null;
  breath?: Awaited<ReturnType<typeof setupBreath>> | null;
  userData?: Awaited<ReturnType<typeof loadUserData>> | null;
  eyeBlinkIds?: Awaited<ReturnType<typeof setupEyeBlinkIds>> | null;
  lipsyncIds?: Awaited<ReturnType<typeof setupLipsyncIds>> | null;
  motions?: Awaited<ReturnType<typeof loadCubismMotion>> | null;
  motionManager?: CubismMotionManager | null;
  textures?: Awaited<ReturnType<typeof setupTextures>> | null;
  renderer?: CubismRenderer_WebGL | null;
}

/**
 * 全てのモデルアセットを集約した計算プロパティ
 * 子コンポーネントやイベントで使用する一貫したインターフェースを提供
 */
const modelAssets = computed<CubismModelAssets>(() => ({
  modelHomeDir: props.modelHomeDir,
  modelFileName: props.modelFileName,
  modelSetting: modelSetting.value,
  moc: moc.value,
  model: model.value,
  expressions: expressions.value,
  expressionManager: expressionManager.value,
  physics: physics.value,
  pose: pose.value,
  eyeBlink: eyeBlink.value,
  breath: breath.value,
  userData: userData.value,
  eyeBlinkIds: eyeBlinkIds.value,
  lipsyncIds: lipsyncIds.value,
  motions: motions.value,
  motionManager: motionManager.value,
  textures: textures.value,
  renderer: renderer.value,
}));

const emits = defineEmits<{
  (e: 'loaded', assets: CubismModelAssets): void;
}>();

// 子コンポーネントで利用するためにモデルアセットを提供
export type ProvidedCubismModelAssets = Ref<CubismModelAssets>;
provide<ProvidedCubismModelAssets>('CubismModelAssets', modelAssets);

// WebGLコンテキストを親コンポーネントから注入
const gl = safeInject<ProvidedWebGLRenderingContext>('WebGLRenderingContext');

/**
 * モデルアセットの読み込み処理
 * モデルの読み込みから初期化までの一連の処理を実行
 *
 * @param modelHomeDir モデルファイルが格納されているディレクトリパス
 * @param modelFileName 読み込むモデルファイル名（.model3.jsonファイル）
 */
async function loadAssets(modelHomeDir: string, modelFileName: string) {
  if (!gl.value) {
    logger.error('WebGLレンダリングコンテキストの取得に失敗しました');
    return;
  }

  // モデル設定ファイル(.model3.json)の読み込み
  modelSetting.value = await loadModelSetting(modelHomeDir, modelFileName);
  if (!modelSetting.value) {
    logger.error('モデル設定ファイルの読み込みに失敗しました');
    return;
  }

  // MOCファイルの読み込みとモデルの構築
  moc.value = await loadCubismMoc(modelHomeDir, modelSetting.value);
  if (!moc.value) {
    logger.error('MOCファイルの読み込みに失敗しました');
    return;
  }

  // モデルインスタンスの作成
  model.value = await loadCubismModel(moc.value);
  if (!model.value) {
    logger.error('モデルの作成に失敗しました');
    return;
  }

  // モデル変換行列の初期化
  modelMatrix.value = new CubismModelMatrix(model.value.getCanvasWidth(), model.value.getCanvasHeight());

  // 表情データの読み込みと表情マネージャーの初期化
  expressions.value = await loadCubismExpression(modelHomeDir, modelSetting.value);
  expressionManager.value = new CubismExpressionMotionManager();

  // 物理演算設定の読み込み
  physics.value = await loadCubismPhysics(modelHomeDir, modelSetting.value);

  // ポーズ設定の読み込み
  pose.value = await loadCubismPose(modelHomeDir, modelSetting.value);

  // まばたき機能の初期化
  eyeBlink.value = await setupEyeBlink(modelSetting.value);

  // 呼吸機能の初期化
  breath.value = await setupBreath();

  // ユーザーデータの読み込み
  userData.value = await loadUserData(modelHomeDir, modelSetting.value);

  // まばたきパラメータIDの設定
  eyeBlinkIds.value = await setupEyeBlinkIds(modelSetting.value);

  // リップシンクパラメータIDの設定
  lipsyncIds.value = await setupLipsyncIds(modelSetting.value);

  // モーションデータの読み込みとマネージャーの初期化
  motions.value = await loadCubismMotion(modelHomeDir, model.value, modelSetting.value);
  motionManager.value = new CubismMotionManager();
  motionManager.value.setEventCallback((
    caller: CubismMotionQueueManager,
    eventValue: csmString,
    customData: null
  ) => {
    logger.debug(`モーションイベント: ${eventValue.s}, ${customData}`);
  }, null);
  // WebGLレンダラーの初期化
  const maskBufferCount = 2; // マスク描画用バッファ数
  renderer.value = new CubismRenderer_WebGL();
  renderer.value.initialize(model.value, maskBufferCount);
  renderer.value.startUp(gl.value);

  // テクスチャの読み込みと設定
  textures.value = await setupTextures(modelHomeDir, modelSetting.value, renderer.value.gl);
  for (let modelTextureNumber = 0; modelTextureNumber < modelSetting.value.getTextureCount(); modelTextureNumber++) {
    const textureInfo = textures.value.at(modelTextureNumber);
    renderer.value.bindTexture(modelTextureNumber, textureInfo.id);
  }
  renderer.value.setIsPremultipliedAlpha(true);

  // アセット読み込み完了イベントの発火
  emits('loaded', modelAssets.value);
  initialized.value = true;
}

/**
 * モデルアセットの解放処理
 * 読み込まれた全てのリソースを適切に解放して
 * メモリリークを防止する
 */
function releaseAssets() {
  // WebGLリソースとテクスチャの解放
  renderer.value?.release();
  renderer.value = null;
  textures.value?.clear();
  textures.value = null;

  // モーション関連リソースの解放
  motionManager.value?.release();
  motionManager.value = null;
  motions.value?.clear();
  motions.value = null;

  // パラメータIDコレクションの解放
  lipsyncIds.value?.clear();
  lipsyncIds.value = null;
  eyeBlinkIds.value?.clear();
  eyeBlinkIds.value = null;

  // その他モデル機能の解放
  userData.value?.release();
  userData.value = null;
  breath.value = null;
  eyeBlink.value = null;
  pose.value = null;
  physics.value?.release();
  physics.value = null;
  expressionManager.value?.release();
  expressionManager.value = null;
  expressions.value?.release();
  expressions.value = null;

  // コアモデルリソースの解放
  if (model.value) {
    moc.value?.deleteModel(model.value);
    model.value = null;
  }
  moc.value?.release();
  moc.value = null;
  modelSetting.value = null;
}

/**
 * コンポーネントマウント時の初期化処理
 */
onMounted(async () => {
  await loadAssets(props.modelHomeDir, props.modelFileName);
});

/**
 * コンポーネントアンマウント時のクリーンアップ処理
 */
onBeforeUnmount(() => {
  initialized.value = false;
});

/**
 * コンポーネントアンマウント時のクリーンアップ処理
 */
onUnmounted(() => {
  releaseAssets();
});

/**
 * モデルファイルの変更を監視し、変更時に再読み込みを実行
 */
watch(() => props.modelHomeDir + props.modelFileName, async () => {
  initialized.value = false;

  releaseAssets();
  await loadAssets(props.modelHomeDir, props.modelFileName);
  logger.debug('モデルアセットが再読み込みされました');
});
</script>

<style scoped></style>
