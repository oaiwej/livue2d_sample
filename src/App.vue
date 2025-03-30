<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <header class="bg-gray-100 dark:bg-gray-800 py-4">
    <h1 class="text-center">Livue2D sample app</h1>
    <div class="max-w-6xl mx-auto px-4">
      <nav class="flex justify-center">
        <RouterLink to="/gallary"
          class="px-4 py-2 text-gray-300 hover:text-white font-medium mx-2 rounded hover:bg-gray-700 transition-colors">
          Gallary</RouterLink>

        <RouterLink to="/multi-character"
          class="px-4 py-2 text-gray-300 hover:text-white font-medium mx-2 rounded hover:bg-gray-700 transition-colors">
          Multi Character</RouterLink>

        <RouterLink to="/novel-game"
          class="px-4 py-2 text-gray-300 hover:text-white font-medium mx-2 rounded hover:bg-gray-700 transition-colors">
          Novel Game</RouterLink>

        <RouterLink to="/llm-chat"
          class="px-4 py-2 text-gray-300 hover:text-white font-medium mx-2 rounded hover:bg-gray-700 transition-colors">
          LLM Chat</RouterLink>

        <RouterLink to="/video-render"
          class="px-4 py-2 text-gray-300 hover:text-white font-medium mx-2 rounded hover:bg-gray-700 transition-colors">
          Video Render</RouterLink>
      </nav>
    </div>
  </header>

  <!-- ここにLive2Dモデルを表示する -->

  <RouterView />
</template>

<style scoped>
nav>a+a::before {
  content: '/';
  margin: 0 8px;
  color: #ccc;
}
</style>
