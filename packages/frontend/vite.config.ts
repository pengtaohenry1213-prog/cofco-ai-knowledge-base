import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@ai-ka/shared': path.resolve(__dirname, '../../shared/src')
    }
  },
  server: {
    port: 8080,
    proxy: {
      // 代理后端接口，解决跨域
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
