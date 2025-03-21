import GallaryView from '@/views/GallaryView.vue'
import LlmChatView from '@/views/LlmChatView.vue'
import MultiCharacterView from '@/views/MultiCharacterView.vue'
import NovelGameView from '@/views/NovelGameView.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: GallaryView,
    },
    {
      path: '/gallary',
      name: 'Gallary',
      component: GallaryView,
    },
    {
      path: '/multi-character',
      name: 'MultiCharacter',
      component: MultiCharacterView,
    },
    {
      path: '/novel-game',
      name: 'NovelGame',
      component: NovelGameView,
    },
    {
      path: '/llm-chat',
      name: 'LLMChat',
      component: LlmChatView,
    },
  ],
})

export default router
