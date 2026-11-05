import type { Agent, GuideGraduation, GuideTeam, GuideWeaponTier } from '@/types/agent'
import { media } from '@/lib/media'
import { analyzeSubstats, PHOENIX_PROFILE } from '@/core/substats'

const W = 1200
const H = 1780
const PAD = 64
const BG = '#070709'
const PANEL = '#101015'
const LINE = '#23232c'
const TEXT = '#f3f1ea'
const TEXT2 = '#c9c6bd'
const MUTED = '#8f8c82'
const ACCENT = '#f0df4e'
const FIRE = '#ff6a3d'
const DISPLAY = '"Barlow Condensed", "Noto Sans SC", sans-serif'
const SANS = '"Noto Sans SC", sans-serif'

type ImageMap = Map<string, HTMLImageElement | null>

function font(size: number, weight = 400, family = SANS) {
  return `${weight} ${size}px ${family}`
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null)
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const ratio = Math.max(w / image.width, h / image.height)
  const width = image.width * ratio
  const height = image.height * ratio
  ctx.drawImage(image, x + (w - width) / 2, y + (h - height) / 2, width, height)
}

function drawContain(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const ratio = Math.min(w / image.width, h / image.height)
  const width = image.width * ratio
  const height = image.height * ratio
  ctx.drawImage(image, x + (w - width) / 2, y + (h - height) / 2, width, height)
}

function textWidth(ctx: CanvasRenderingContext2D, text: string) {
  return ctx.measureText(text).width
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const char of Array.from(text)) {
    if (textWidth(ctx, line + char) > maxWidth && line) {
      lines.push(line)
      line = char
    } else {
      line += char
    }
  }
  if (line) lines.push(line)
  return lines
}

function paragraph(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  options: { size?: number; weight?: number; color?: string; family?: string; lineHeight?: number; maxLines?: number } = {},
): number {
  const size = options.size ?? 14
  const lineHeight = options.lineHeight ?? size * 1.6
  ctx.font = font(size, options.weight ?? 400, options.family ?? SANS)
  ctx.fillStyle = options.color ?? MUTED
  const lines = wrap(ctx, text, maxWidth).slice(0, options.maxLines ?? 3)
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight)
  })
  return y + lines.length * lineHeight
}

function section(ctx: CanvasRenderingContext2D, index: string, title: string, y: number) {
  ctx.font = font(22, 700, DISPLAY)
  ctx.fillStyle = ACCENT
  ctx.fillText(index, PAD, y)
  ctx.font = font(26, 600, DISPLAY)
  ctx.fillStyle = TEXT
  ctx.fillText(title, PAD + 46, y - 2)
  ctx.fillStyle = LINE
  ctx.fillRect(PAD + 46 + textWidth(ctx, title) + 18, y + 14, W - PAD * 2 - 46 - textWidth(ctx, title) - 18, 1)
}

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill = PANEL) {
  ctx.fillStyle = fill
  ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = LINE
  ctx.lineWidth = 1
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)
}

function chip(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  active = false,
) {
  ctx.fillStyle = active ? ACCENT : PANEL
  ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = active ? ACCENT : LINE
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)
  ctx.font = font(13, active ? 600 : 400, SANS)
  ctx.fillStyle = active ? '#14140f' : TEXT2
  ctx.textAlign = 'center'
  ctx.fillText(text, x + w / 2, y + h / 2 - 6)
  ctx.textAlign = 'left'
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  agent: Agent,
  images: ImageMap,
) {
  const full = images.get(agent.assets.full)
  const tachie = images.get(agent.assets.tachie)
  if (full) {
    ctx.save()
    ctx.globalAlpha = 0.34
    drawCover(ctx, full, 0, 0, W, 370)
    ctx.restore()
  }
  const gradient = ctx.createLinearGradient(0, 0, W, 370)
  gradient.addColorStop(0, 'rgba(7,7,9,0.94)')
  gradient.addColorStop(0.58, 'rgba(7,7,9,0.58)')
  gradient.addColorStop(1, 'rgba(7,7,9,0.98)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, W, 370)
  ctx.fillStyle = ACCENT
  ctx.fillRect(0, 0, W, 5)

  if (tachie) drawContain(ctx, tachie, 730, 8, 440, 350)

  ctx.textBaseline = 'top'
  ctx.font = font(16, 600, DISPLAY)
  ctx.fillStyle = ACCENT
  ctx.fillText('CHARACTER GUIDE  /  代理人攻略', PAD, 42)

  ctx.font = font(76, 700, DISPLAY)
  ctx.fillStyle = TEXT
  ctx.fillText(agent.name, PAD - 2, 76)

  ctx.font = font(25, 500, SANS)
  ctx.fillStyle = TEXT2
  ctx.fillText(agent.fullName, PAD, 168)

  const tags = [agent.element, agent.specialty, `${agent.rarity} 级`, agent.faction]
  let tagX = PAD
  tags.forEach((tag, index) => {
    ctx.font = font(12, 500, SANS)
    const width = textWidth(ctx, tag) + 18
    chip(ctx, tag, tagX, 210, width, 26, index === 0)
    tagX += width + 8
  })

  paragraph(ctx, agent.intro, PAD, 258, 620, { size: 14, color: TEXT2, lineHeight: 24, maxLines: 2 })

  ctx.font = font(12, 500, DISPLAY)
  ctx.fillStyle = MUTED
  ctx.fillText('ZENLESS SOLUTION  ·  PHOENIX FILE 001', PAD, 332)
}

function drawSkills(ctx: CanvasRenderingContext2D, agent: Agent, y: number) {
  section(ctx, '01', '技能加点', y)
  const items = agent.guide.skillPriority
  const gap = 10
  const width = (W - PAD * 2 - gap * (items.length - 1)) / items.length
  items.forEach((item, index) => {
    const x = PAD + index * (width + gap)
    panel(ctx, x, y + 30, width, 58)
    ctx.font = font(14, 600, SANS)
    ctx.fillStyle = TEXT
    ctx.fillText(item.label, x + 12, y + 40)
    ctx.font = font(11, 500, SANS)
    ctx.fillStyle = MUTED
    ctx.fillText(`Lv.${item.level} / ${item.maxLevel}`, x + 12, y + 61)
    if (item.next) {
      ctx.font = font(18, 600, DISPLAY)
      ctx.fillStyle = ACCENT
      ctx.fillText(item.next, x + width - 20, y + 48)
    }
  })
}

function drawCinemas(ctx: CanvasRenderingContext2D, agent: Agent, y: number) {
  section(ctx, '02', '影画', y)
  const keyLevels = new Set(agent.guide.cinemaPriority.keyLevels)
  const start = PAD
  const size = 62
  const gap = 14
  for (let level = 1; level <= 6; level += 1) {
    const x = start + (level - 1) * (size + gap)
    const key = keyLevels.has(level)
    panel(ctx, x, y + 28, size, 52, key ? ACCENT : PANEL)
    ctx.font = font(20, 700, DISPLAY)
    ctx.fillStyle = key ? '#14140f' : TEXT2
    ctx.textAlign = 'center'
    ctx.fillText(String(level).padStart(2, '0'), x + size / 2, y + 44)
    ctx.textAlign = 'left'
  }
  ctx.font = font(12, 500, SANS)
  ctx.fillStyle = MUTED
  ctx.fillText(`关键影画 ${Array.from(keyLevels).join(' / ')} · 技能 +2 不计入伤害对比`, start + 6 * (size + gap) + 16, y + 52)
}

function drawWeapons(
  ctx: CanvasRenderingContext2D,
  tiers: GuideWeaponTier[],
  y: number,
  images: ImageMap,
) {
  section(ctx, '03', '音擎推荐', y)
  const items = tiers.flatMap((tier) => tier.items.map((item) => ({ ...item, tier: tier.tier })))
  const colWidth = (W - PAD * 2 - 20) / 2
  items.forEach((item, index) => {
    const col = index % 2
    const row = Math.floor(index / 2)
    const x = PAD + col * (colWidth + 20)
    const top = y + 30 + row * 76
    panel(ctx, x, top, colWidth, 64)
    const image = images.get(item.icon)
    if (image) drawContain(ctx, image, x + 10, top + 8, 46, 46)
    ctx.font = font(11, 500, SANS)
    ctx.fillStyle = MUTED
    ctx.fillText(item.tier, x + 68, top + 10)
    ctx.font = font(16, 600, SANS)
    ctx.fillStyle = TEXT
    ctx.fillText(item.name, x + 68, top + 27)
    ctx.font = font(11, 400, SANS)
    ctx.fillStyle = MUTED
    ctx.fillText(`${item.stats} · 精 ${item.refinement}`, x + 68, top + 47)
  })
}

function effectiveLine(panel: GuideGraduation): string {
  const spec = panel.spec
  if (!spec.subStats?.length) return ''
  const map: Record<string, string> = { am: 'anomaly_proficiency', pen_val: 'pen_value' }
  const counts = Object.fromEntries(spec.subStats.map((item) => [map[item.id] ?? item.id, item.count]))
  const result = analyzeSubstats(counts, PHOENIX_PROFILE, { budget: spec.budget })
  return `${result.effective} 有效 · ${result.small} 小 · ${result.invalid} 无效`
}

function drawDrives(ctx: CanvasRenderingContext2D, agent: Agent, y: number, images: ImageMap) {
  section(ctx, '04', '驱动盘', y)
  const build = agent.guide.builds[0]
  if (!build) return
  panel(ctx, PAD, y + 30, W - PAD * 2, 150)
  const set4 = images.get(build.set4.icon)
  if (set4) drawContain(ctx, set4, PAD + 14, y + 44, 52, 52)
  ctx.font = font(18, 600, SANS)
  ctx.fillStyle = TEXT
  ctx.fillText(`4  ${build.set4.name}`, PAD + 78, y + 44)
  ctx.font = font(12, 400, SANS)
  ctx.fillStyle = MUTED
  ctx.fillText(build.set4.label, PAD + 78, y + 68)

  const set2 = build.set2[0]
  if (set2) {
    const image = images.get(set2.icon)
    if (image) drawContain(ctx, image, PAD + 370, y + 44, 52, 52)
    ctx.font = font(18, 600, SANS)
    ctx.fillStyle = TEXT
    ctx.fillText(`2  ${build.set2.map((item) => item.name).join(' / ')}`, PAD + 434, y + 44)
    ctx.font = font(12, 400, SANS)
    ctx.fillStyle = MUTED
    ctx.fillText(build.set2.map((item) => item.label ?? '').join(' / '), PAD + 434, y + 68)
  }

  build.mainStats.forEach((stat, index) => {
    const x = PAD + 14 + index * 360
    ctx.font = font(11, 500, SANS)
    ctx.fillStyle = ACCENT
    ctx.fillText(stat.slot, x, y + 104)
    ctx.font = font(13, 500, SANS)
    ctx.fillStyle = TEXT2
    ctx.fillText(stat.main, x, y + 124)
    if (stat.alt && stat.alt !== '无') {
      ctx.font = font(10, 400, SANS)
      ctx.fillStyle = MUTED
      ctx.fillText(`备选 ${stat.alt}`, x, y + 145)
    }
  })
}

function drawTeams(ctx: CanvasRenderingContext2D, teams: GuideTeam[], y: number, images: ImageMap) {
  section(ctx, '05', '队伍参考', y)
  const width = (W - PAD * 2 - 20) / 2
  teams.slice(0, 2).forEach((team, index) => {
    const x = PAD + index * (width + 20)
    panel(ctx, x, y + 30, width, 140)
    ctx.font = font(13, 600, SANS)
    ctx.fillStyle = TEXT
    ctx.fillText(team.name, x + 14, y + 42)
    team.members.slice(0, 3).forEach((member, memberIndex) => {
      const top = y + 68 + memberIndex * 30
      const image = images.get(member.avatar)
      if (image) drawContain(ctx, image, x + 14, top, 24, 24)
      ctx.font = font(12, 500, SANS)
      ctx.fillStyle = TEXT2
      ctx.fillText(member.name, x + 48, top + 3)
      ctx.font = font(10, 400, SANS)
      ctx.fillStyle = MUTED
      ctx.fillText(member.role, x + 150, top + 4)
      ctx.fillText(member.note.length > 22 ? `${member.note.slice(0, 22)}…` : member.note, x + 220, top + 4)
    })
  })
}

function drawGraduation(
  ctx: CanvasRenderingContext2D,
  cards: GuideGraduation[],
  y: number,
) {
  section(ctx, '06', '毕业面板', y)
  const width = (W - PAD * 2 - 20) / 2
  cards.slice(0, 2).forEach((card, index) => {
    const x = PAD + index * (width + 20)
    panel(ctx, x, y + 30, width, 150)
    ctx.font = font(13, 600, SANS)
    ctx.fillStyle = TEXT
    ctx.fillText(card.title.replace(/（.*?）/, ''), x + 14, y + 44)
    card.totals.forEach((total, totalIndex) => {
      const left = x + 14 + totalIndex * 166
      ctx.font = font(10, 400, SANS)
      ctx.fillStyle = MUTED
      ctx.fillText(total.label, left, y + 78)
      ctx.font = font(22, 600, DISPLAY)
      ctx.fillStyle = ACCENT
      ctx.fillText(`${total.value}${total.unit}`, left, y + 96)
    })
    const line = effectiveLine(card)
    if (line) {
      ctx.font = font(10, 400, SANS)
      ctx.fillStyle = MUTED
      ctx.fillText(line, x + 14, y + 140)
    }
  })
}

function cardScene(agent: Agent, images: ImageMap, canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d unavailable')
  ctx.textBaseline = 'top'
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, W, H)
  drawHeader(ctx, agent, images)
  drawSkills(ctx, agent, 400)
  drawCinemas(ctx, agent, 526)
  drawWeapons(ctx, agent.guide.weapons, 646, images)
  drawDrives(ctx, agent, 1000, images)
  drawTeams(ctx, agent.guide.teams, 1208, images)
  drawGraduation(ctx, [agent.guide.graduation, agent.guide.graduationAlt].filter((item): item is GuideGraduation => Boolean(item)), 1436)
  ctx.font = font(10, 400, SANS)
  ctx.fillStyle = MUTED
  ctx.fillText('数据：官方 WIKI · 计算：局外面板 / 20s 参考轴 · 菲欧妮攻略卡', PAD, 1720)
  ctx.textAlign = 'right'
  ctx.fillText(agent.updatedAt ?? '', W - PAD, 1720)
  ctx.textAlign = 'left'
  return ctx
}

export async function renderGuideCard(agent: Agent, scale = 2): Promise<Blob> {
  if (document.fonts) await document.fonts.ready
  const keys = new Set<string>()
  keys.add(agent.assets.full)
  keys.add(agent.assets.tachie)
  for (const tier of agent.guide.weapons) for (const item of tier.items) keys.add(item.icon)
  const build = agent.guide.builds[0]
  if (build) {
    keys.add(build.set4.icon)
    for (const item of build.set2) keys.add(item.icon)
  }
  for (const team of agent.guide.teams) for (const member of team.members) keys.add(member.avatar)

  const images: ImageMap = new Map()
  await Promise.all(
    Array.from(keys).map(async (key) => {
      images.set(key, await loadImage(media(key)))
    }),
  )

  const canvas = document.createElement('canvas')
  canvas.width = W * scale
  canvas.height = H * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d unavailable')
  ctx.scale(scale, scale)
  cardScene(agent, images, canvas)
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('生成攻略卡失败'))), 'image/png')
  })
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export async function saveGuideCard(agent: Agent) {
  const blob = await renderGuideCard(agent)
  download(blob, `${agent.name}-攻略卡.png`)
}

export async function copyGuideCard(agent: Agent): Promise<boolean> {
  const blob = await renderGuideCard(agent)
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    download(blob, `${agent.name}-攻略卡.png`)
    return false
  }
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    return true
  } catch {
    download(blob, `${agent.name}-攻略卡.png`)
    return false
  }
}
