<template>
  <slot v-if="initialized"></slot>
</template>

<script setup lang="ts">
import { logger } from '@/logger';
import { CubismFramework } from '@framework/live2dcubismframework';
import { onBeforeUnmount, onMounted, onUnmounted, ref } from 'vue';

const initialized = ref(false);

onMounted(async () => {
  // Live2Dの初期化処理
  CubismFramework.startUp()
  CubismFramework.initialize()
  logger.debug('CubismFramework has been initialized')

  initialized.value = true;
});

onBeforeUnmount(() => {
  initialized.value = false;
});

onUnmounted(() => {
  // Live2Dの終了処理
  CubismFramework.dispose()
  CubismFramework.cleanUp()
  logger.debug('CubismFramework has been disposed')
});
</script>

<style scoped></style>
