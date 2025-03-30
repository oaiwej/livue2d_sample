<template>
  <input type="time" step="0.001" :value="formattedValue" @input="handleInput"
    class="font-mono text-center min-w-36 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
</template>

<script setup lang="ts">
/**
 * @file VTimestampInput.vue
 * @brief タイムスタンプ入力コンポーネント
 *      - HH:MM:SS.mmm 形式
 *      - ミリ秒は省略可能
 */
import { computed } from 'vue';

const model = defineModel<number>({
  default: 0
});

// ミリ秒をHH:MM:SS.msの形式に変換
const formattedValue = computed(() => {
  const totalSeconds = model.value / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = model.value % 1000;

  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return `${timeString}.${milliseconds.toString().padStart(3, '0')}`;
});

// 入力値からミリ秒を計算
const handleInput = (event: Event) => {
  const timeString = (event.target as HTMLInputElement).value;
  if (!timeString) {
    model.value = 0;
    return;
  }

  const [hourMinSec, millisStr] = timeString.split('.');
  const [hours, minutes, seconds] = hourMinSec.split(':').map(Number);

  const milliseconds = millisStr ? parseInt(millisStr, 10) : 0;
  const totalMilliseconds = (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + milliseconds;

  model.value = totalMilliseconds;
};

</script>
