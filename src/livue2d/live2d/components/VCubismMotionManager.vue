<template>
  <slot v-if="initialized"></slot>
</template>

<script setup lang="ts">
import { logger } from '@/logger';
import type { ACubismMotion } from '@framework/motion/acubismmotion';
import type { CubismMotionQueueEntry } from '@framework/motion/cubismmotionqueueentry';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { safeInject } from '../utils/safeInject';
import type { ProvidedCubismModelAssets } from './VCubismModelAssetsProvider.vue';

const initialized = ref(false);

// プロパティとイベント定義
const props = withDefaults(defineProps<{
  // モーションのグループ名
  group: string | null;
  // モーションのインデックス
  index: number | null;
  // モーションの優先度（値が大きいほど優先される）
  priority?: number;
  // モーションをループするかどうか
  loop?: boolean;
}>(), {
  priority: 1,
  loop: false,
});

// イベント発行の定義
export type MotionEvent = { motion: ACubismMotion, groupName: string, index: number, priority: number };
const emit = defineEmits<{
  // モーションが開始された時に発火するイベント
  (event: 'motion-started', e: MotionEvent): void;
  // モーションが終了した時に発火するイベント
  (event: 'motion-finished', e: MotionEvent): void;
}>();

// CubismModelAssets関数の注入
const assets = safeInject<ProvidedCubismModelAssets>('CubismModelAssets');


/**
 * モーションを開始する
 * @param groupName モーショングループ名
 * @param index モーションインデックス
 * @param priority 優先度（値が大きいほど優先される）
 * @returns モーション開始結果（成功した場合は非負の値、失敗した場合はnull）
 */
function startMotion(
  groupName: string,
  index: number,
  priority: number,
  onMotionFinished?: (e: MotionEvent) => void,
  onMotionStarted?: (e: MotionEvent) => void,
) {
  // 必要なアセットを取得
  const {
    modelSetting,
    motions,
    motionManager,
    eyeBlinkIds,
    lipsyncIds,
  } = assets.value;

  // アセット存在確認
  if (!modelSetting || !motions || !motionManager) {
    logger.error('モデルアセットの取得に失敗しました');
    return null;
  }

  // モーションのファイル名を取得
  const motionFileName = modelSetting.getMotionFileName(groupName, index);
  if (!motionFileName) {
    logger.warn(`指定されたモーションのファイル名を取得できませんでした（グループ: ${groupName}, インデックス: ${index}）`);
    return null;
  }

  // モーションオブジェクトを取得
  const motion = motions.getValue(motionFileName);
  if (!motion) {
    logger.warn(`モーションの取得に失敗しました（ファイル名: ${motionFileName}）`);
    return null;
  }

  // まばたきとリップシンクのIDがある場合、モーションに設定
  if (eyeBlinkIds && lipsyncIds) {
    motion.setEffectIds(eyeBlinkIds, lipsyncIds);
  }

  // モーション終了時のハンドラを設定
  motion.setFinishedMotionHandler((motion: ACubismMotion) => {
    const e = { motion, groupName, index, priority };
    emit('motion-finished', e);
    onMotionFinished?.(e);
  });

  // モーション開始時のハンドラを設定
  motion.setBeganMotionHandler(() => {
    const e = { motion, groupName, index, priority };
    emit('motion-started', e);
    onMotionStarted?.(e);
  });

  // モーションを開始
  const result = motionManager.startMotionPriority(motion, false, priority) as CubismMotionQueueEntry;
  logger.debug(`モーション開始: グループ = ${groupName}, インデックス = ${index}, 優先度 = ${priority}, QueueCount=${motionManager.getCubismMotionQueueEntries().getSize()}`);
  return result;
}

/**
 * モーションを停止する
 */
function stopMotion() {
  const { motionManager } = assets.value;
  if (motionManager) {
    motionManager.stopAllMotions();
  }
}

/**
 * モーションを切り替える
 */
function switchMotion() {
  if (!initialized.value) {
    return;
  }
  if (props.group === null || props.index === null) {
    logger.debug(`モーションが指定されていません（グループ: ${props.group}, インデックス: ${props.index}）`);
    stopMotion();
    return;
  }
  startMotion(props.group, props.index, props.priority, () => {
    if (props.loop) {
      switchMotion();
    }
  });
}

// コンポーネントマウント時にモーションを開始
onMounted(() => {
  initialized.value = true;
  stopMotion();
  switchMotion();
});

// コンポーネントアンマウント時にモーションを停止
onBeforeUnmount(() => {
  initialized.value = false;
  stopMotion();
});

// プロパティが変更された時にモーションを開始
watch(() => [props.group, props.index, props.priority, props.loop], () => {
  switchMotion();
});

</script>

<style scoped></style>
