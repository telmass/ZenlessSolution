import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue'),
      meta: { title: '绝区零图鉴与代理人攻略' },
    },
    {
      path: '/agents',
      name: 'agents',
      component: () => import('@/pages/AgentListPage.vue'),
      meta: { title: '代理人图鉴' },
    },
    {
      path: '/agents/:slug',
      name: 'agent',
      component: () => import('@/pages/AgentPage.vue'),
    },
    {
      path: '/engines',
      name: 'engines',
      component: () => import('@/pages/EngineListPage.vue'),
      meta: { title: '音擎图鉴' },
    },
    {
      path: '/engines/:id',
      name: 'engine',
      component: () => import('@/pages/EngineDetailPage.vue'),
    },
    {
      path: '/drives',
      name: 'drives',
      component: () => import('@/pages/DriveListPage.vue'),
      meta: { title: '驱动盘图鉴' },
    },
    {
      path: '/drives/:id',
      name: 'drive',
      component: () => import('@/pages/DriveDetailPage.vue'),
    },
    {
      path: '/bangboo',
      name: 'bangboo',
      component: () => import('@/pages/BangbooListPage.vue'),
      meta: { title: '邦布图鉴' },
    },
    {
      path: '/bangboo/:slug',
      name: 'bangboo-detail',
      component: () => import('@/pages/BangbooDetailPage.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/NotFoundPage.vue'),
      meta: { title: '页面未找到' },
    },
  ],
  scrollBehavior(to, _from, saved) {
    if (saved) return saved
    // The agent page owns hash scrolling so sticky header + chapter nav
    // offsets stay in one place and programmatic scrolls are not doubled.
    if (to.name === 'agent') return false
    if (to.hash) return { el: to.hash, top: 96, behavior: 'smooth' }
    return { top: 0 }
  },
})

export default router
