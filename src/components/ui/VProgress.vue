<template>
  <div
    class="h-2.5 rounded-full transition-all duration-300 ease-in-out bg-[var(--color-theme-700)] dark:bg-[var(--color-theme-500)]"
    :style="{ width: `${percentageInt}%` }"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  percentage: number;
}>();

const percentageInt = computed(() => {
  return Math.max(0, Math.min(100, Math.round(props.percentage * 100)));
});
</script>
