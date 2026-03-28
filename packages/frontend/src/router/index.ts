import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/upload'
  },
  {
    path: '/upload',
    name: 'DocumentUpload',
    component: () => import('@/views/DocumentUpload.vue'),
    meta: {
      title: '文档上传'
    }
  },
  {
    path: '/chat',
    name: 'IntelligentChat',
    component: () => import('@/views/IntelligentChat.vue'),
    meta: {
      title: '智能对话'
    }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to, _from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - AI 知识库助手`;
  }
  next();
});

export default router;
