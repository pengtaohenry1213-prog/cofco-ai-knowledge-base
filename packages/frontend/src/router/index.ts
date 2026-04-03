import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/knowledge'
  },
  {
    path: '/space',
    name: 'MySpace',
    component: () => import('@/views/DocumentUpload.vue'),
    meta: {
      title: '我的空间'
    }
  },
  {
    path: '/agent',
    name: 'AgentChat',
    component: () => import('@/views/IntelligentChat.vue'),
    meta: {
      title: '智能体'
    }
  },
  {
    path: '/knowledge',
    name: 'KnowledgeBase',
    component: () => import('@/views/KnowledgeBaseList.vue'),
    meta: {
      title: '知识库'
    }
  },
  {
    path: '/knowledge/new',
    name: 'KnowledgeBaseNew',
    component: () => import('@/views/KnowledgeBaseForm.vue'),
    meta: {
      title: '新建知识库'
    }
  },
  {
    path: '/knowledge/:id/edit',
    name: 'KnowledgeBaseEdit',
    component: () => import('@/views/KnowledgeBaseForm.vue'),
    meta: {
      title: '配置知识库'
    }
  },
  {
    path: '/documents',
    name: 'DocumentManager',
    component: () => import('@/views/DocumentManager.vue'),
    meta: {
      title: '文档管理'
    }
  },
  {
    path: '/upload',
    redirect: '/space'
  },
  {
    path: '/chat',
    redirect: '/agent'
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
