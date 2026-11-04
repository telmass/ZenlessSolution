export function trimNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—'
  const rounded = Number(value.toFixed(digits))
  return String(rounded)
}

export function formatStat(value: number, unit: string): string {
  if (unit === '%') return `${trimNumber(value, 1)}%`
  return trimNumber(value, value % 1 === 0 ? 0 : 1)
}

export function formatMod(value: number, kind: 'pct' | 'flat'): string {
  return kind === 'pct' ? `+${trimNumber(value, 2)}%` : `+${trimNumber(value, 2)}`
}
