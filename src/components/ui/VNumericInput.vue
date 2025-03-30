<template>
  <input v-model="proxyModel" />
</template>

<script setup lang="ts">
import { computed } from 'vue';


const model = defineModel<number>({
  default: () => 0,
})

const proxyModel = computed<number>({
  get: () => model.value,
  set: (value) => {
    model.value = Number(value);
  },
})
</script>

<style scoped></style>
