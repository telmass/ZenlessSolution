import { reactive } from 'vue'

/**
 * 全局路由导航状态：供顶部加载条与错误占位使用。
 * router 守卫写入，App.vue 读取。
 */
export const navigation = reactive({
  pending: false,
  failed: false,
})
