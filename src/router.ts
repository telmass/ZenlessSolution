import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue'),
    },
    {
      path: '/agents',
      name: 'agents',
      component: () => import('@/pages/AgentListPage.vue'),
    },
    {
      path: '/agents/:slug',
      name: 'agent',
      component: () => import('@/pages/AgentPage.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
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
