import { createApp, nextTick } from 'vue'
import App from './App.vue'
import router from './router'
import { navigation } from './lib/navigation'
import { setPageMeta } from './lib/seo'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/codex.css'

const app = createApp(App)

app.config.errorHandler = (error) => {
  console.error(error)
}

router.beforeEach(() => {
  navigation.pending = true
})

router.afterEach((to) => {
  navigation.pending = false
  const title = typeof to.meta.title === 'string' ? to.meta.title : undefined
  if (title) setPageMeta(title)
  // 路由切换后把焦点移到正文，便于键盘/读屏用户从新页面开始。
  nextTick(() => {
    document.getElementById('content')?.focus({ preventScroll: true })
  })
})

router.onError(() => {
  navigation.pending = false
})

app.use(router).mount('#app')
