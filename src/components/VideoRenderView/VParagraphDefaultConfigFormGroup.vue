<template>
  <div>
    <div class="flex flex-col gap-2">
      <label class="text-sm">話者</label>
      <select v-model="paragraph.speaker">
        <template v-for="speaker in speakers" :key="speaker.speaker_uuid">
          <option v-for="style in speaker.styles" :key="style.id" :value="style.id">
            {{ speaker.name }} - {{ style.name }}
          </option>
        </template>
      </select>
    </div>
    <div class="flex flex-col gap-2">
      <label class="text-sm">再生速度</label>
      <input type="number" step="0.1" v-model="paragraph.speedScale" />
    </div>
    <div class="flex flex-col gap-2">
      <label class="text-sm">表情</label>
      <select v-model="paragraph.expressionType">
        <option :value="null">None</option>
        <option v-for="expressionType in EXPRESSION_TYPES" :key="expressionType" :value="expressionType">
          {{ expressionType }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EXPRESSION_TYPES } from '@/livue2d/utils/app/type/ExpressionType';
import { DEFAULT_PARAGRAPH, type Paragraph } from '@/livue2d/utils/app/type/Paragraph';
import { requestSpeakers } from '@/livue2d/utils/voicevox/requestSpeakers';
import type { VoiceVoxSpeakersResponse } from '@/livue2d/utils/voicevox/type/VoiceVoxSpeakers';
import { onMounted, ref } from 'vue';

const paragraph = defineModel<Paragraph>({
  default: () => (DEFAULT_PARAGRAPH),
})

const speakers = ref<VoiceVoxSpeakersResponse>([])

onMounted(async () => {
  speakers.value = await requestSpeakers();
})

</script>

<style scoped></style>
