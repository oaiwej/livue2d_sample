<template>
  <slot v-if="initialized"></slot>
</template>

<script setup lang="ts">
import { logger } from '@/logger';
import type { CubismIdHandle } from '@framework/id/cubismid';
import { Constant } from '@framework/live2dcubismframework';
import { CubismMatrix44 } from '@framework/math/cubismmatrix44';
import type { CubismModel } from '@framework/model/cubismmodel';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { isPointInTriangle } from '../utils/isPointInTriangle';
import { safeInject } from '../utils/safeInject';
import { type ProvidedWebGLRenderingContext } from './VCubismCanvasWebGLProvider.vue';
import type { ProvidedCubismModelAssets } from './VCubismModelAssetsProvider.vue';
import type { ProvidedCubismModelMatrix } from './VCubismModelMatrixProvider.vue';
import type { ProvidedCubismProjectionMatrix } from './VCubismProjectionMatrixProvider.vue';
import type { ProvidedCubismViewMatrix } from './VCubismViewMatrixProvider.vue';

const initialized = ref(false);

/**
 * ヒットエリアのイベントインターフェース
 * Live2Dモデルのヒットエリアがタッチされたときのイベント情報
 */
export interface CubismHitEvent {
  /** ヒットエリアの名前 */
  hitAreaName: string;
  /** ヒットエリアのID */
  hitAreaId: CubismIdHandle;
  /** タッチされたX座標 */
  x: number;
  /** タッチされたY座標 */
  y: number;
}

const emit = defineEmits<{
  (event: 'hit', e: CubismHitEvent): void,
}>();

// WebGL描画コンテキストと関連アセットの取得
const gl = safeInject<ProvidedWebGLRenderingContext>('WebGLRenderingContext');
const assets = safeInject<ProvidedCubismModelAssets>('CubismModelAssets');
const projectionMatrix = safeInject<ProvidedCubismProjectionMatrix>('CubismProjectionMatrix');
const viewMatrix = safeInject<ProvidedCubismViewMatrix>('CubismViewMatrix');
const modelMatrix = safeInject<ProvidedCubismModelMatrix>('CubismModelMatrix');

/**
 * 指定された座標がドローアブル領域内にあるかを判定する
 * @param model Live2Dモデル
 * @param drawableId 判定対象のドローアブルID
 * @param px X座標
 * @param py Y座標
 * @returns 座標が領域内にある場合true
 */
function isHit(model: CubismModel, drawableId: CubismIdHandle, tx: number, ty: number): boolean {
  const drawIndex = model.getDrawableIndex(drawableId);
  if (drawIndex < 0) {
    return false;
  }

  const vertices = model.getDrawableVertices(drawIndex);
  const dim = Constant.vertexStep;      // 頂点座標の次元数
  const offset = Constant.vertexOffset; // 頂点座標のオフセット値
  const NUM_VERTICES = 3;               // 三角形の頂点数
  for (let i = offset; i <= vertices.length - (dim * NUM_VERTICES); i += dim) {
    const v1 = [vertices[i], vertices[i + 1]];
    const v2 = [vertices[i + dim], vertices[i + dim + 1]];
    const v3 = [vertices[i + dim * 2], vertices[i + dim * 2 + 1]];
    // 三角形の内部に指定座標が含まれるかを判定
    if (isPointInTriangle([tx, ty], v1, v2, v3)) {
      return true;
    }
  }
  return false;
}

/**
 * 指定した座標がヒットエリア内にあるかをテストする
 * @param tx X座標
 * @param ty Y座標
 * @returns ヒットした場合はヒットイベント情報、ヒットしなかった場合はnull
 */
function hitTest(tx: number, ty: number): CubismHitEvent | null {
  const { modelSetting, model } = assets.value;
  if (!modelSetting || !model) {
    logger.error('ModelSetting or Model is not found');
    return null;
  }

  // すべてのヒットエリアをチェック
  const hitAreaCount = modelSetting.getHitAreasCount();
  for (let i = 0; i < hitAreaCount; i++) {
    const hitAreaId = modelSetting.getHitAreaId(i);
    const hitAreaName = modelSetting.getHitAreaName(i);
    if (isHit(model, hitAreaId, tx, ty)) {
      return { hitAreaId, hitAreaName, x: tx, y: ty };
    }
  }
  return null;
}

/**
 * タッチイベントハンドラ
 * @param event マウスイベント
 */
function touchHit(event: MouseEvent) {
  if (!gl.value) {
    return;
  }
  const canvas = gl.value.canvas as HTMLCanvasElement;
  const deviceToScreen = new CubismMatrix44();
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const left = projectionMatrix.value.invertTransformX(-1.0);
  const right = projectionMatrix.value.invertTransformX(1.0);
  // const bottom = projectionMatrix.value.invertTransformY(-1.0);
  // const top = projectionMatrix.value.invertTransformY(1.0);

  deviceToScreen.loadIdentity();
  const screenW = Math.abs(right - left);
  deviceToScreen.scaleRelative(screenW / width, -screenW / width);
  deviceToScreen.translateRelative(-width * 0.5, -height * 0.5);

  let x = event.offsetX;
  let y = event.offsetY;
  x = deviceToScreen.transformX(x);
  y = deviceToScreen.transformY(y);
  x = viewMatrix?.value.invertTransformX(x) ?? x;
  y = viewMatrix?.value.invertTransformY(y) ?? y;
  x = modelMatrix?.value.invertTransformX(x) ?? x;
  y = modelMatrix?.value.invertTransformY(y) ?? y;

  const hit = hitTest(x, y);
  if (hit) {
    emit('hit', hit);
    logger.debug(`Hit: ${hit.hitAreaName} (${hit.x}, ${hit.y})`);
  }
}


// コンポーネントマウント時の処理
onMounted(() => {
  if (!gl.value) {
    return;
  }
  const canvas = gl.value.canvas as HTMLCanvasElement;
  canvas.addEventListener('click', touchHit);
  initialized.value = true;
});

// コンポーネントアンマウント時の処理
onBeforeUnmount(() => {
  initialized.value = false;
  if (!gl.value) {
    return;
  }
  const canvas = gl.value.canvas as HTMLCanvasElement;
  canvas.removeEventListener('click', touchHit);
});
</script>

<style scoped></style>
