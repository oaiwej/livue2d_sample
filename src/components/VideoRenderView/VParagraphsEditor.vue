<script setup lang="ts">
import VTimestampInput from '@/components/ui/VTimestampInput.vue';
import { EXPRESSION_TYPES } from '@/utils/app/type/ExpressionType';
import { DEFAULT_PARAGRAPH, type Paragraph } from '@/utils/app/type/Paragraph';
import { getDurationFromAudioQueries } from '@/utils/voicevox/getDurationFromAudioQuery';
import { requestAudioQuery } from '@/utils/voicevox/requestAudioQuery';
import { requestSpeakers } from '@/utils/voicevox/requestSpeakers';
import { requestSynthesis } from '@/utils/voicevox/requestSynthesis';
import { splitSentence } from '@/utils/voicevox/splitSentence';
import type { VoiceVoxSpeakersResponse } from '@/utils/voicevox/type/VoiceVoxSpeakers';
import { v4 as uuid } from 'uuid';
import { nextTick, onMounted, ref, watch } from 'vue';


const paragraphs = defineModel<Paragraph[]>({
  default() {
    return [];
  }
})

const props = withDefaults(defineProps<{
  padTime?: number
}>(), {
  padTime: 500,
});

const speakers = ref<VoiceVoxSpeakersResponse | null>(null)
onMounted(async () => {
  // 話者情報を取得
  const speakersResponse = await requestSpeakers();
  speakers.value = speakersResponse;

  // 空の場合は初期段落を追加
  if (paragraphs.value.length === 0) {
    paragraphs.value.push({ ...DEFAULT_PARAGRAPH, id: uuid() });
  }
  // 初期段落にフォーカス
  document.getElementById(paragraphs.value[0].id)?.focus();
});

// ----------------------------------------
const currentParagraph = ref<Paragraph | null>(null);
// 段落の開始時間と終了時間を監視
watch(() => [...paragraphs.value.map(p => p.start), ...paragraphs.value.map(p => p.end)], () => {
  // 時間を再計算
  paragraphs.value.reduce((prev, paragraph) => {
    const duration = paragraph.end - paragraph.start;
    paragraph.start = prev;
    paragraph.end = prev + duration;
    return paragraph.end;
  }, paragraphs.value[0]?.start ?? 0);
});

function onFocusParagraph(paragraph: Paragraph) {
  currentParagraph.value = paragraph;
}

async function loadAudioQueries(paragraph: Paragraph) {
  const sentences = splitSentence(paragraph.text);
  paragraph.audioQueries = [];
  for (const sentence of sentences) {
    const query_response = await requestAudioQuery(sentence, paragraph.speaker);
    paragraph.audioQueries.push(query_response);
  }
}

function isCtrlDown(e: KeyboardEvent) {
  return e.ctrlKey || e.metaKey;
}

function onKeydownEnter(e: KeyboardEvent, paragraph: Paragraph) {
  // Shift + Enter
  if (e.shiftKey) {
    return; // 改行
  }
  // Enter
  const promise = paragraph.text.trim() === ''
    ? Promise.resolve()            // 空の場合はパディングと見なす
    : loadAudioQueries(paragraph); // 音声合成クエリを取得

  // 最後の段落の場合は、次の段落を追加 または Ctrl + Enter で追加
  const shouldAddParagraph = paragraphs.value.indexOf(paragraph) === paragraphs.value.length - 1 || isCtrlDown(e);

  promise.then(() => {
    if (paragraph.audioQueries) {
      // 再生時間を計算
      const duration = getDurationFromAudioQueries(paragraph.audioQueries) ?? 0;
      const durationMs = Math.round(duration * 1000);
      paragraph.end = paragraph.start + durationMs + props.padTime;
    }

    // 次の段落を追加
    if (shouldAddParagraph) {
      const newParagraph = {
        ...paragraph,
        id: uuid(),
        text: '',
        start: paragraph.end,
        end: paragraph.end + 10_000,
        audioQueries: null,
      };
      paragraphs.value.splice(paragraphs.value.indexOf(paragraph) + 1, 0, newParagraph);
      // フォーカス
      nextTick(() => {
        document.getElementById(newParagraph.id)?.focus();
      });
    }
    else {
      // フォーカス
      nextTick(() => {
        document.getElementById(paragraphs.value[paragraphs.value.indexOf(paragraph) + 1].id)?.focus();
      });
    }
  });
  e.preventDefault();
}

function onKeydownBackspace(e: KeyboardEvent, paragraph: Paragraph) {
  if (paragraphs.value.length === 1) {
    return;
  }
  // Ctrl + Backspace で削除
  if (isCtrlDown(e)) {
    const index = paragraphs.value.indexOf(paragraph);
    paragraphs.value.splice(index, 1);
    e.preventDefault();
  }
}

function onKeydownArrow(e: KeyboardEvent, paragraph: Paragraph) {
  const index = paragraphs.value.indexOf(paragraph);
  // Ctrl + 上下矢印で移動
  if (isCtrlDown(e)) {
    if (e.key === 'ArrowUp' && index > 0) {
      // 時間を入れ替え
      const start1 = paragraphs.value[index - 1].start;
      const end1 = paragraphs.value[index - 1].end;
      const start2 = paragraphs.value[index].start;
      const end2 = paragraphs.value[index].end;
      paragraphs.value[index].start = start1;
      paragraphs.value[index].end = start1 + (end2 - start2);
      paragraphs.value[index - 1].start = start1 + (end2 - start2) + (start2 - end1);
      paragraphs.value[index - 1].end = end2;

      // 上に移動
      paragraphs.value.splice(index - 1, 0, paragraphs.value.splice(index, 1)[0]);
      // フォーカス
      nextTick(() => {
        document.getElementById(paragraphs.value[index - 1].id)?.focus();
      });
      e.preventDefault();
    }
    else if (e.key === 'ArrowDown' && index < paragraphs.value.length - 1) {
      // 時間を入れ替え
      const start1 = paragraphs.value[index].start;
      const end1 = paragraphs.value[index].end;
      const start2 = paragraphs.value[index + 1].start;
      const end2 = paragraphs.value[index + 1].end;
      paragraphs.value[index + 1].start = start1;
      paragraphs.value[index + 1].end = start1 + (end2 - start2);
      paragraphs.value[index].start = start1 + (end2 - start2) + (start2 - end1);
      paragraphs.value[index].end = end2;
      // 下に移動
      paragraphs.value.splice(index + 1, 0, paragraphs.value.splice(index, 1)[0]);
      // フォーカス
      nextTick(() => {
        document.getElementById(paragraphs.value[index + 1].id)?.focus();
      });
      e.preventDefault();
    }
  }
}

function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  return date.toISOString().slice(11, 19);
}

const audio = ref<HTMLAudioElement>(new Audio());
audio.value.onended = () => {
  const blobUrl = audio.value.src;
  audio.value.currentTime = 0;
  audio.value.src = '';
  URL.revokeObjectURL(blobUrl);
};
async function playSampleVoice(paragraph: Paragraph) {
  const audioQuery = await requestAudioQuery('こんな声です。', paragraph.speaker);
  audioQuery.speedScale = paragraph.speedScale;
  const buffer = await requestSynthesis(audioQuery, paragraph.speaker);
  const blobUrl = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
  audio.value.currentTime = 0;
  audio.value.src = blobUrl;
  audio.value.play();
}
</script>

<template>
  <!-- Paragraphsの入力欄 -->
  <div class="flex flex-row w-full min-h-64 gap-2">
    <div class="flex-1 flex flex-col gap-2 p-2 rounded-xl overflow-y-auto">
      <div v-for="paragraph, index in paragraphs" :key="paragraph.id" class="flex flex-col gap-1 w-full">
        <div class="flex flex-row gap-2 w-full">
          <!-- text -->
          <div class="flex flex-col gap-2 w-full">
            <label class="text-sm">{{ index + 1 }}. {{ formatTimestamp(paragraph.start) }} --&gt; {{
              formatTimestamp(paragraph.end) }}</label>
            <textarea :id="paragraph.id" v-model="paragraph.text" class="w-full border border-gray-300 rounded p-2"
              placeholder="テキスト" @focus="onFocusParagraph(paragraph)" @vue:mounted="$event.el?.focus()"
              @keydown.enter="onKeydownEnter($event, paragraph)"
              @keydown.backspace="onKeydownBackspace($event, paragraph)"
              @keydown.arrow-up="onKeydownArrow($event, paragraph)"
              @keydown.arrow-down="onKeydownArrow($event, paragraph)" :required="index === 0" />
          </div>
        </div>
      </div>
    </div>
    <div v-if="currentParagraph" class="flex flex-col bg-gray-300 dark:bg-gray-950 p-4 rounded-xl overflow-y-auto">
      <!-- start -->
      <div class=" flex flex-col gap-2 w-full py-2">
        <label class="text-sm">開始時間</label>
        <VTimestampInput v-model="currentParagraph.start" placeholder="開始時間" />
      </div>
      <!-- end -->
      <div class=" flex flex-col gap-2 w-full py-2">
        <label class="text-sm">終了時間</label>
        <VTimestampInput v-model="currentParagraph.end" placeholder="終了時間" />
      </div>
      <!-- speaker -->
      <div class=" flex flex-col gap-2 w-full py-2">
        <label class="text-sm">話者</label>
        <select v-model="currentParagraph.speaker" @change="playSampleVoice(currentParagraph)"
          class="w-64 border border-gray-300 rounded p-2">
          <template v-for="speaker in speakers" :key="speaker.speaker_uuid">
            <option v-for="style in speaker.styles" :key="style.id" :value="style.id">
              {{ speaker.name }} - {{ style.name }}
            </option>
          </template>
        </select>
        <!-- speedScale -->
        <div class="flex flex-col gap-2 w-full py-2">
          <label class="text-sm">再生速度</label>
          <input type="number" step="0.1" v-model="currentParagraph.speedScale"
            class="w-64 border border-gray-300 rounded p-2" />
        </div>
        <!-- expressionType -->
        <div class="flex flex-col gap-2 w-full py-2">
          <label class="text-sm">表情</label>
          <select v-model="currentParagraph.expressionType" class="w-64 border border-gray-300 rounded p-2">
            <option v-for="expressionType in EXPRESSION_TYPES" :key="expressionType" :value="expressionType">
              {{ expressionType }}
            </option>
          </select>
        </div>
        <!-- キー操作説明 -->
        <div class="flex flex-row gap-2 w-full py-2">
          <div class="flex flex-col gap-2 w-full">
            <label class="text-sm">キー操作</label>
            <p class="text-sm">Enter: 次の行</p>
            <p class="text-sm">Shift + Enter: 改行</p>
            <p class="text-sm">Ctrl + Enter: 次の行を追加</p>
            <p class="text-sm">Ctrl + Backspace: 行を削除</p>
            <p class="text-sm">Ctrl + ↑↓: 行を移動</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
