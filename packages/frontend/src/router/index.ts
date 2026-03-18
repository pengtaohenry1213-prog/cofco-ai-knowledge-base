import { createRouter, createWebHistory } from 'vue-router';

// 路由配置
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/chat'
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('@/views/ChatBot.vue')
    },
    {
      path: '/upload',
      name: 'upload',
      component: () => import('@/views/UploadDoc.vue')
    }
  ]
});

export default router;
