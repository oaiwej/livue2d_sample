<template>
  <slot v-if="initialized"></slot>
</template>

<script setup lang="ts">
import type { PostRenderFunction, ProvidedRegisterPostRenderFunction, ProvidedRegisterRenderFunction, ProvidedRegisterUpdateFunction, ProvidedUnregisterPostRenderFunction, ProvidedUnregisterRenderFunction, ProvidedUnregisterUpdateFunction, RenderFunction, UpdateFunction } from '@/livue2d/live2d/components/VCubismRenderLoopProvider.vue';
import { safeInject } from '@/livue2d/live2d/utils/safeInject';
import { computed, onBeforeUnmount, onMounted, provide, ref } from 'vue';

/**
 * @file VVideoDeltaTimeProvider.vue
 * @brief deltaTimeを置き換えるコンポーネント
 *   - 動画のレンダリングのために常に一定のdeltaTimeを提供する
 */


const props = withDefaults(defineProps<{
  fps?: number;
}>(), {
  fps: 30,
});

export interface VideoDeltaTimeUpdateEvent {
  deltaTime: number;
  currentTime: number;
}
const emit = defineEmits<{
  (event: 'timeupdate', e: VideoDeltaTimeUpdateEvent): void;
}>();

const initialized = ref(false);
const deltaTime = computed(() => 1.0 / props.fps);
const currentTime = ref(0);
const updateFunctions = ref<UpdateFunction[]>([]);
const renderFunctions = ref<{ render: RenderFunction, zIndex: number }[]>([]);
const postRenderFunctions = ref<PostRenderFunction[]>([]);

// オリジナルの関数を取得
const originalRegisterUpdateFunction = safeInject<ProvidedRegisterUpdateFunction>('RegisterUpdateFunction');
const originalUnregisterUpdateFunction = safeInject<ProvidedUnregisterUpdateFunction>('UnregisterUpdateFunction');
const originalRegisterRenderFunction = safeInject<ProvidedRegisterRenderFunction>('RegisterRenderFunction');
const originalUnregisterRenderFunction = safeInject<ProvidedUnregisterRenderFunction>('UnregisterRenderFunction');
const originalRegisterPostRenderFunction = safeInject<ProvidedRegisterPostRenderFunction>('RegisterPostRenderFunction');
const originalUnregisterPostRenderFunction = safeInject<ProvidedUnregisterPostRenderFunction>('UnregisterPostRenderFunction');

// Provideを上書き
provide<ProvidedRegisterUpdateFunction>('RegisterUpdateFunction', (updateFunction: UpdateFunction) => {
  updateFunctions.value.push(updateFunction);
});
provide<ProvidedUnregisterUpdateFunction>('UnregisterUpdateFunction', (updateFunction: UpdateFunction) => {
  updateFunctions.value.filter((f) => f !== updateFunction);
});
provide<ProvidedRegisterRenderFunction>('RegisterRenderFunction', (renderFunction: RenderFunction, zIndex: number = 0) => {
  renderFunctions.value.push({ render: renderFunction, zIndex });
});
provide<ProvidedUnregisterRenderFunction>('UnregisterRenderFunction', (renderFunction: RenderFunction) => {
  renderFunctions.value.filter((f) => f.render !== renderFunction);
  renderFunctions.value.sort((a, b) => a.zIndex - b.zIndex);
});
provide<ProvidedRegisterPostRenderFunction>('RegisterPostRenderFunction', (postRenderFunction: PostRenderFunction) => {
  postRenderFunctions.value.push(postRenderFunction);
});
provide<ProvidedUnregisterPostRenderFunction>('UnregisterPostRenderFunction', (postRenderFunction: PostRenderFunction) => {
  postRenderFunctions.value.filter((f) => f !== postRenderFunction);
});


async function update() {
  currentTime.value += deltaTime.value;
  emit('timeupdate', { deltaTime: deltaTime.value, currentTime: currentTime.value });
  // 常に一定のdeltaTimeを提供する
  await updateFunctions.value.reduce((prev, current) => {
    return prev.then(() => current(deltaTime.value));
  }, Promise.resolve());
}

async function render() {
  // 常に一定のdeltaTimeを提供する
  await renderFunctions.value.reduce((prev, current) => {
    return prev.then(() => current.render(deltaTime.value));
  }, Promise.resolve());
}

async function postRender() {
  // 常に一定のdeltaTimeを提供する
  await postRenderFunctions.value.reduce((prev, current) => {
    return prev.then(() => current(deltaTime.value));
  }, Promise.resolve());
}


onMounted(() => {
  originalRegisterUpdateFunction(update);
  originalRegisterRenderFunction(render);
  originalRegisterPostRenderFunction(postRender);
  initialized.value = true;
});

onBeforeUnmount(() => {
  initialized.value = false;
  originalUnregisterUpdateFunction(update);
  originalUnregisterRenderFunction(render);
  originalUnregisterPostRenderFunction(postRender);
});

</script>

<style lang="scss" scoped></style>
