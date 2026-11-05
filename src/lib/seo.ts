const BASE_TITLE = 'ZenlessSolution · 绝区零图鉴与代理人攻略'

function setMeta(selector: string, content: string) {
  const node = document.head.querySelector<HTMLMetaElement>(selector)
  if (node) node.setAttribute('content', content)
}

/**
 * 设置当前页面的 document.title 与 description。
 * 纯 SPA：路由切换时调用，保证分享链接 / 标签页标题正确。
 */
export function setPageMeta(title?: string, description?: string) {
  document.title = title ? `${title} · ZenlessSolution` : BASE_TITLE
  if (description) {
    setMeta('meta[name="description"]', description)
    setMeta('meta[property="og:description"]', description)
  }
}

export const SITE_TITLE = BASE_TITLE
