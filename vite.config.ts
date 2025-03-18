import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      '@/': fileURLToPath(new URL('./src', import.meta.url)) + '/',
      '@core/': fileURLToPath(new URL('./CubismSdkForWeb/Core/', import.meta.url)) + '/',
      '@framework/':
        fileURLToPath(new URL('./CubismSdkForWeb/Framework/src/', import.meta.url)) + '/',
      '@demo/':
        fileURLToPath(new URL('./CubismSdkForWeb/Samples/TypeScript/Demo/src', import.meta.url)) +
        '/',
    },
  },
})
