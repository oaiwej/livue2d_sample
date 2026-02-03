<template>
  <slot v-if="initialized"></slot>
</template>

<script setup lang="ts">
import { logger } from '@/logger';
import { onMounted, ref, watch } from 'vue';
import { safeInject } from '../utils/safeInject';
import type { ProvidedCubismModelAssets } from './VCubismModelAssetsProvider.vue';

// 初期化状態管理用の変数
const initialized = ref(false);

// プロパティ定義
const props = withDefaults(defineProps<{
  // 表情のインデックス
  index: number | null;
}>(), {
});

// イベント発行の定義
export type ExpressionEvent = { index: number };
const emit = defineEmits<{
  // 表情が開始された時に発火するイベント
  (event: 'expression-started', e: ExpressionEvent): void;
  // 表情が終了した時に発火するイベント
  (event: 'expression-finished', e: ExpressionEvent): void;
}>();

// CubismModelAssets関数の注入
const assets = safeInject<ProvidedCubismModelAssets>('CubismModelAssets');

/**
 * 表情を開始する
 * @param index 表情のインデックス
 * @returns 表情開始結果（成功した場合は非負の値、失敗した場合はnull）
 */
function startExpression(index: number) {
  // 必要なアセットを取得
  const {
    modelSetting,
    expressions,
    expressionManager
  } = assets.value;

  // アセット存在確認
  if (!modelSetting || !expressions || !expressionManager) {
    logger.error('表情関連のアセットの取得に失敗しました');
    return null;
  }

  // 表情のインデックスが有効かチェック
  if (!modelSetting.getExpressionCount() || index < 0 || index >= modelSetting.getExpressionCount()) {
    logger.warn(`指定された表情のインデックスが範囲外です: ${index}`);
    return null;
  }

  // 表情の名前を取得
  const expressionName = modelSetting.getExpressionName(index);
  if (!expressionName) {
    logger.warn(`指定された表情の名前を取得できませんでした（インデックス: ${index}）`);
    return null;
  }

  // 表情のファイル名を取得
  const expressionFileName = modelSetting.getExpressionFileName(index);
  if (!expressionFileName) {
    logger.warn(`指定された表情のファイル名を取得できませんでした（インデックス: ${index}）`);
    return null;
  }

  // 表情オブジェクトを取得
  const expression = expressions.getValue(expressionName);
  if (!expression) {
    logger.warn(`表情の取得に失敗しました（ファイル名: ${expressionFileName}）`);
    return null;
  }

  // 表情終了時のハンドラを設定
  expression.setFinishedMotionHandler(() => {
    emit('expression-finished', { index });
  });

  // 表情開始時のハンドラを設定
  expression.setBeganMotionHandler(() => {
    emit('expression-started', { index });
  });

  // 表情を開始
  const result = expressionManager.startMotion(expression, false);
  logger.debug(`表情開始: インデックス=${index}`);
  return result;
}

/**
 * 表情を停止する
 */
function stopExpression() {
  // 必要なアセットを取得
  const {
    expressionManager
  } = assets.value;

  if (expressionManager) {
    expressionManager.stopAllMotions();
    return;
  }
}

/**
 * 表情を切り替える
 */
function switchExpression() {
  if (!initialized.value) {
    return;
  }
  if (props.index === null) {
    stopExpression();
    return;
  }
  startExpression(props.index);
}

// コンポーネントマウント時に表情を開始
onMounted(() => {
  initialized.value = true;
  switchExpression();
});

// プロパティが変更された時に表情を再開
watch(() => [props.index], () => {
  switchExpression();
});
</script>

<style scoped></style>
