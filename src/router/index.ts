import GallaryView from '@/views/GallaryView.vue'
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
  ],
})

export default router
