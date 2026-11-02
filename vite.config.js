import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Vite 配置：演示项目保持最简
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5180,
    host: true // 允许局域网访问，方便发给对方看
  }
})
