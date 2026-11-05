import type { Agent, GuideGraduation, GuideTeam, GuideWeaponTier } from '@/types/agent'
import { media } from '@/lib/media'
import { analyzeSubstats, PHOENIX_PROFILE } from '@/core/substats'

const W = 1620
const H = 1000
const CARD_X = 16
const CARD_Y = 16
const CARD_W = W - 32
const CARD_H = H - 32
const BODY_LINE = 650
const LABEL_X = 676
const VALUE_X = 810

const INK = '#111318'
const MUTED = '#343a45'
const LINE = '#4b5563'
const BORDER = '#cfd4dd'
const CHIP = '#ffffff'
const SOFT = '#eef0f4'
const ACCENT = '#fdf0d5'
const ACCENT_INK = '#7a4a00'
const SANS = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif'
const DISPLAY = '"Barlow Condensed", "Noto Sans SC", sans-serif'

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

function drawContain(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const ratio = Math.min(w / image.width, h / image.height)
  const width = image.width * ratio
  const height = image.height * ratio
  ctx.drawImage(image, x + (w - width) / 2, y + (h - height) / 2, width, height)
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
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

function pill(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: { h?: number; pad?: number; size?: number; weight?: number; fill?: string; border?: string; color?: string; radius?: number } = {},
) {
  const h = options.h ?? 28
  const pad = options.pad ?? 10
  ctx.font = font(options.size ?? 12, options.weight ?? 500)
  const w = textWidth(ctx, text) + pad * 2
  roundRect(ctx, x, y, w, h, options.radius ?? 999)
  ctx.fillStyle = options.fill ?? CHIP
  ctx.fill()
  ctx.strokeStyle = options.border ?? BORDER
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = options.color ?? MUTED
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + w / 2, y + h / 2 + 0.5)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  return w
}

function rowLabel(ctx: CanvasRenderingContext2D, label: string, y: number) {
  ctx.strokeStyle = LINE
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(BODY_LINE - 18, y + 18)
  ctx.lineTo(BODY_LINE, y + 18)
  ctx.stroke()
  ctx.font = font(18, 700)
  ctx.fillStyle = INK
  ctx.fillText(label, LABEL_X, y)
}

function sectionBody(ctx: CanvasRenderingContext2D, y: number) {
  ctx.strokeStyle = LINE
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(BODY_LINE, 64)
  ctx.lineTo(BODY_LINE, H - 60)
  ctx.stroke()
  void y
}

function effectiveLine(panel: GuideGraduation): string {
  const spec = panel.spec
  if (!spec.subStats?.length) return ''
  const map: Record<string, string> = { am: 'anomaly_proficiency', pen_val: 'pen_value' }
  const counts = Object.fromEntries(spec.subStats.map((item) => [map[item.id] ?? item.id, item.count]))
  const result = analyzeSubstats(counts, PHOENIX_PROFILE, { budget: spec.budget })
  return `${result.effective} 有效 · ${result.small} 小 · ${result.invalid} 无效`
}

function drawPortrait(ctx: CanvasRenderingContext2D, agent: Agent, images: ImageMap) {
  const full = images.get(agent.assets.full)
  const tachie = images.get(agent.assets.tachie)
  const avatar = images.get(agent.assets.avatar)
  const x = 48
  const y = 48
  const w = 544
  const h = 700

  ctx.fillStyle = '#ffffff'
  roundRect(ctx, x, y, w, h, 22)
  ctx.fill()

  if (full) drawContain(ctx, full, x + 8, y + 8, w - 16, h - 16)
  else if (tachie) drawContain(ctx, tachie, x + 8, y + 8, w - 16, h - 16)
  else if (avatar) drawContain(ctx, avatar, x + 70, y + 110, w - 140, w - 140)

  ctx.font = font(42, 700, DISPLAY)
  ctx.fillStyle = INK
  ctx.fillText(agent.name, x + 4, y + h + 26)

  ctx.font = font(18, 500)
  ctx.fillStyle = MUTED
  ctx.fillText(agent.fullName, x + 4, y + h + 76)

  let tagX = x + 4
  const tags = [agent.element, agent.specialty, `${agent.rarity} 级`, agent.faction]
  tags.forEach((tag, index) => {
    const width = pill(ctx, tag, tagX, y + h + 112, {
      h: 26,
      size: 11,
      fill: index === 0 ? ACCENT : CHIP,
      border: index === 0 ? '#f0d9a0' : BORDER,
      color: index === 0 ? ACCENT_INK : MUTED,
    })
    tagX += width + 6
  })

  ctx.font = font(11, 500, DISPLAY)
  ctx.fillStyle = '#7b8494'
  ctx.fillText('ZENLESS SOLUTION  ·  PHOENIX FILE 001', x + 4, H - 46)
}

function drawSkills(ctx: CanvasRenderingContext2D, agent: Agent, y: number, images: ImageMap) {
  rowLabel(ctx, '技能加点', y)
  const items = agent.guide.skillPriority
  let x = VALUE_X
  items.forEach((item, index) => {
    const iconPath = `/assets/ui/skills/${item.key}.webp`
    const icon = images.get(iconPath)
    const labelWidth = textWidth(ctx, item.label)
    const w = labelWidth + 48
    roundRect(ctx, x, y, w, 36, 999)
    ctx.fillStyle = CHIP
    ctx.fill()
    ctx.strokeStyle = BORDER
    ctx.lineWidth = 1
    ctx.stroke()
    if (icon) drawContain(ctx, icon, x + 4, y + 6, 24, 24)
    ctx.font = font(11, 600)
    ctx.fillStyle = INK
    ctx.fillText(item.label, x + 32, y + 5)
    ctx.font = font(9, 500)
    ctx.fillStyle = MUTED
    ctx.fillText(`Lv.${item.level}`, x + 32, y + 21)
    x += w + 8
    if (index < items.length - 1) {
      ctx.font = font(11, 700, DISPLAY)
      ctx.fillStyle = MUTED
      ctx.fillText(item.next || '·', x, y + 11)
      x += 14
    }
  })
}

function drawCinemas(ctx: CanvasRenderingContext2D, agent: Agent, y: number) {
  rowLabel(ctx, '命座推荐', y)
  const key = new Set(agent.guide.cinemaPriority.keyLevels)
  let x = VALUE_X
  for (let level = 1; level <= 6; level += 1) {
    const active = key.has(level)
    roundRect(ctx, x, y, 40, 34, 9)
    ctx.fillStyle = active ? INK : SOFT
    ctx.fill()
    ctx.strokeStyle = active ? INK : BORDER
    ctx.stroke()
    ctx.font = font(13, 700, DISPLAY)
    ctx.fillStyle = active ? '#ffffff' : MUTED
    ctx.textAlign = 'center'
    ctx.fillText(String(level).padStart(2, '0'), x + 20, y + 10)
    ctx.textAlign = 'left'
    x += 48
  }
  ctx.font = font(11, 500)
  ctx.fillStyle = MUTED
  ctx.fillText(`关键 ${Array.from(key).join(' / ')} · 技能 +2 不计入伤害对比`, x + 4, y + 10)
}

function drawWeapons(
  ctx: CanvasRenderingContext2D,
  tiers: GuideWeaponTier[],
  y: number,
  images: ImageMap,
) {
  rowLabel(ctx, '音擎推荐', y)
  let top = y - 4
  for (const tier of tiers) {
    const tierWidth = pill(ctx, tier.tier, VALUE_X, top + 2, {
      h: 26,
      pad: 9,
      size: 10,
      weight: 700,
      fill: tier === tiers[0] ? ACCENT : SOFT,
      border: tier === tiers[0] ? '#f0d9a0' : 'transparent',
      color: tier === tiers[0] ? ACCENT_INK : MUTED,
    })
    let x = VALUE_X + tierWidth + 8
    for (const weapon of tier.items) {
      const icon = images.get(weapon.icon)
      const label = `${weapon.name} · 精${weapon.refinement}`
      const width = textWidth(ctx, label) + 52
      roundRect(ctx, x, top, width, 32, 9)
      ctx.fillStyle = CHIP
      ctx.fill()
      ctx.strokeStyle = BORDER
      ctx.stroke()
      if (icon) drawContain(ctx, icon, x + 4, top + 3, 26, 26)
      ctx.font = font(11, 500)
      ctx.fillStyle = INK
      ctx.fillText(label, x + 34, top + 9)
      x += width + 6
    }
    top += 36
  }
}

function drawDrives(ctx: CanvasRenderingContext2D, agent: Agent, y: number, images: ImageMap) {
  rowLabel(ctx, '驱动盘推荐', y)
  const build = agent.guide.builds[0]
  if (!build) return
  let x = VALUE_X
  const set4Icon = images.get(build.set4.icon)
  const set4Label = `4 ${build.set4.name}`
  const w4 = textWidth(ctx, set4Label) + 52
  roundRect(ctx, x, y, w4, 32, 9)
  ctx.fillStyle = CHIP
  ctx.fill()
  ctx.strokeStyle = BORDER
  ctx.stroke()
  if (set4Icon) drawContain(ctx, set4Icon, x + 4, y + 3, 26, 26)
  ctx.font = font(11, 500)
  ctx.fillStyle = INK
  ctx.fillText(set4Label, x + 34, y + 9)
  x += w4 + 6

  const set2 = build.set2[0]
  if (set2) {
    const icon = images.get(set2.icon)
    const label = `2 ${build.set2.map((item) => item.name).join(' / ')}`
    const width = textWidth(ctx, label) + 52
    roundRect(ctx, x, y, width, 32, 9)
    ctx.fillStyle = CHIP
    ctx.fill()
    ctx.strokeStyle = BORDER
    ctx.stroke()
    if (icon) drawContain(ctx, icon, x + 4, y + 3, 26, 26)
    ctx.font = font(11, 500)
    ctx.fillStyle = INK
    ctx.fillText(label, x + 34, y + 9)
  }

  let statX = VALUE_X
  build.mainStats.forEach((stat) => {
    const label = `${stat.slot} ${stat.main}`
    const width = textWidth(ctx, label) + 18
    roundRect(ctx, statX, y + 40, width, 28, 8)
    ctx.fillStyle = SOFT
    ctx.fill()
    ctx.font = font(10, 500)
    ctx.fillStyle = MUTED
    ctx.fillText(label, statX + 9, y + 48)
    if (stat.alt && stat.alt !== '无') {
      ctx.font = font(9, 500)
      ctx.fillStyle = '#7b8494'
      ctx.fillText(`备选 ${stat.alt}`, statX + 9, y + 74)
    }
    statX += Math.max(width, stat.alt && stat.alt !== '无' ? textWidth(ctx, `备选 ${stat.alt}`) + 18 : 0) + 6
  })
}

function drawTeams(ctx: CanvasRenderingContext2D, teams: GuideTeam[], y: number, images: ImageMap) {
  rowLabel(ctx, '队伍推荐', y)
  let top = y - 2
  for (const team of teams.slice(0, 2)) {
    let x = VALUE_X
    const width = pill(ctx, team.name, x, top, {
      h: 26,
      pad: 9,
      size: 10,
      weight: 700,
      fill: SOFT,
      border: 'transparent',
      color: MUTED,
    })
    x += width + 6
    for (const member of team.members.slice(0, 3)) {
      const icon = images.get(member.avatar)
      const label = member.name
      const chipWidth = textWidth(ctx, label) + 46
      roundRect(ctx, x, top, chipWidth, 28, 999)
      ctx.fillStyle = CHIP
      ctx.fill()
      ctx.strokeStyle = BORDER
      ctx.stroke()
      if (icon) drawContain(ctx, icon, x + 2, top + 2, 24, 24)
      ctx.font = font(10, 500)
      ctx.fillStyle = INK
      ctx.fillText(label, x + 30, top + 8)
      x += chipWidth + 6
    }
    top += 38
  }
}

function drawGraduation(ctx: CanvasRenderingContext2D, cards: GuideGraduation[], y: number) {
  rowLabel(ctx, '面板参考', y)
  const width = W - VALUE_X - 56
  cards.slice(0, 2).forEach((card, index) => {
    const top = y - 2 + index * 124
    const x = VALUE_X
    roundRect(ctx, x, top, width, 112, 10)
    ctx.fillStyle = '#f7f8fa'
    ctx.fill()
    ctx.strokeStyle = BORDER
    ctx.stroke()
    ctx.font = font(12, 700)
    ctx.fillStyle = INK
    ctx.fillText(card.title.replace(/（.*?）/, ''), x + 12, top + 8)
    card.totals.forEach((total, totalIndex) => {
      const tx = x + 12 + totalIndex * (width / 3)
      ctx.font = font(9, 500)
      ctx.fillStyle = MUTED
      ctx.fillText(total.label, tx, top + 34)
      ctx.font = font(20, 700, DISPLAY)
      ctx.fillStyle = INK
      ctx.fillText(`${total.value}${total.unit}`, tx, top + 50)
    })
    const line = effectiveLine(card)
    if (line) {
      ctx.font = font(9, 500)
      ctx.fillStyle = MUTED
      ctx.fillText(line, x + 12, top + 84)
    }
  })
}

function drawCard(ctx: CanvasRenderingContext2D, agent: Agent, images: ImageMap) {
  ctx.fillStyle = '#eef1f5'
  ctx.fillRect(0, 0, W, H)
  roundRect(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, 30)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = '#d7dbe2'
  ctx.lineWidth = 1
  ctx.stroke()

  drawPortrait(ctx, agent, images)
  sectionBody(ctx, 80)
  drawSkills(ctx, agent, 82, images)
  drawCinemas(ctx, agent, 140)
  drawWeapons(ctx, agent.guide.weapons, 200, images)
  drawDrives(ctx, agent, 398, images)
  drawTeams(ctx, agent.guide.teams, 492, images)
  drawGraduation(
    ctx,
    [agent.guide.graduation, agent.guide.graduationAlt].filter((item): item is GuideGraduation => Boolean(item)),
    606,
  )
}

export async function renderGuideCard(agent: Agent, scale = 2): Promise<Blob> {
  if (document.fonts) await document.fonts.ready
  const keys = new Set<string>()
  keys.add(agent.assets.full)
  keys.add(agent.assets.tachie)
  keys.add(agent.assets.avatar)
  for (const tier of agent.guide.weapons) for (const item of tier.items) keys.add(item.icon)
  for (const item of agent.guide.skillPriority) keys.add(`/assets/ui/skills/${item.key}.webp`)
  const build = agent.guide.builds[0]
  if (build) {
    keys.add(build.set4.icon)
    for (const item of build.set2) keys.add(item.icon)
  }
  for (const team of agent.guide.teams) for (const member of team.members) keys.add(member.avatar)

  const images: ImageMap = new Map()
  await Promise.all(
    Array.from(keys).map(async (key) => {
      images.set(key, await loadImage(key.startsWith('/') ? key : media(key)))
    }),
  )

  const canvas = document.createElement('canvas')
  canvas.width = W * scale
  canvas.height = H * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d unavailable')
  ctx.scale(scale, scale)
  ctx.textBaseline = 'top'
  drawCard(ctx, agent, images)

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

