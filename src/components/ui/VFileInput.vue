<template>
  <input type="file" :value="model" @change="onChange" />
</template>

<script setup lang="ts">
const model = defineModel<string | null>({
  default: null,
});

const fileList = defineModel<FileList | null>('fileList', {
  default: null,
});

function onChange(event: Event) {
  const target = event.target as HTMLInputElement;
  model.value = target.value;
  fileList.value = target.files;
}
</script>

<style scoped></style>
