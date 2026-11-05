/**
 * 公共资源 URL。
 *
 * Vite 的 `import.meta.env.BASE_URL` 在构建时注入（默认 `/`，部署到
 * GitHub Pages 项目页时为 `/ZenlessSolution/`）。数据里的图片/图标写的是
 * 根路径（`/assets/ui/...`），必须经过这里拼上 base，否则子路径部署会 404。
 */
const BASE = import.meta.env.BASE_URL || '/'

/** 把根路径资源挂到指定 base 下；外链、data / blob 与已带 base 的路径原样返回。 */
export function joinBase(base: string, path?: string | null): string {
  if (!path) return ''
  // 外链（https:、//cdn...）、data / blob 一律原样返回。
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(path)) return path
  const prefix = base.endsWith('/') ? base : `${base}/`
  // 已经带 base（或 base 为根）的不重复拼接。
  if (path.startsWith(prefix)) return path
  return `${prefix}${path.replace(/^\/+/, '')}`
}

export function publicUrl(path?: string | null): string {
  return joinBase(BASE, path)
}
