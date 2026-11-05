import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const SRC = join(ROOT, 'src')

const PX_SCALE = [12, 14, 16, 18, 22, 28, 36, 52, 72]
const REM_SCALE = PX_SCALE.map((value) => value / 16)
const ALLOWED_TOKENS = ['--fs-12', '--fs-14', '--fs-16', '--fs-18', '--fs-22', '--fs-28', '--fs-36', '--fs-52', '--fs-72']

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const files = walk(SRC).filter((file) => file.endsWith('.vue') || file.endsWith('.css'))

function cssDeclarations(source: string, property: string): string[] {
  const out: string[] = []
  const re = new RegExp(`${property}\\s*:\\s*([^;}\\n]+)`, 'g')
  let match: RegExpExecArray | null
  while ((match = re.exec(source))) out.push(match[1].trim())
  return out
}

describe('typography system', () => {
  it('uses only the nine-step type scale for font sizes', () => {
    const findings: string[] = []

    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      for (const value of cssDeclarations(source, 'font-size')) {
        if (value.startsWith('var(') || value.startsWith('clamp(') || value === 'inherit') continue
        const px = /^(\d*\.?\d+)px$/.exec(value)
        const rem = /^(\d*\.?\d+)rem$/.exec(value)
        if (px) {
          const size = Number(px[1])
          if (!PX_SCALE.includes(size)) findings.push(`${relative(ROOT, file)}: ${value}`)
          continue
        }
        if (rem) {
          const size = Number(rem[1])
          if (!REM_SCALE.some((step) => Math.abs(step - size) < 0.001)) {
            findings.push(`${relative(ROOT, file)}: ${value}`)
          }
          continue
        }
        findings.push(`${relative(ROOT, file)}: ${value}`)
      }
    }

    expect(findings, `font-size must use a scale token or clamp():\n${findings.join('\n')}`).toEqual([])
  })

  it('never renders text below 12px and never references removed tokens', () => {
    const findings: string[] = []
    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      const rel = relative(ROOT, file)
      for (const value of cssDeclarations(source, 'font-size')) {
        const px = /^(\d*\.?\d+)px$/.exec(value)
        if (px && Number(px[1]) < 12) findings.push(`${rel}: ${value}`)
        const rem = /^(\d*\.?\d+)rem$/.exec(value)
        if (rem && Number(rem[1]) * 16 < 12) findings.push(`${rel}: ${value}`)
      }
      for (const token of ['--fs-11', '--fs-13', '--fs-15']) {
        if (source.includes(token)) findings.push(`${rel}: removed token ${token}`)
      }
    }
    expect(findings, findings.join('\n')).toEqual([])
  })

  it('keeps the removed micro sizes and faint greys out of text roles', () => {
    const findings: string[] = []
    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      const rel = relative(ROOT, file)
      for (const value of cssDeclarations(source, 'color')) {
        if (value === 'var(--line-strong)') findings.push(`${rel}: color uses --line-strong`)
        if (value === '#3a3a45' || value === '#77746c') findings.push(`${rel}: color uses ${value}`)
      }
      for (const size of ['9px', '9.5px', '10px', '11px']) {
        if (source.includes(`font-size: ${size}`)) findings.push(`${rel}: font-size ${size}`)
      }
    }
    expect(findings, findings.join('\n')).toEqual([])
  })

  it('defines every allowed token', () => {
    const tokens = readFileSync(join(SRC, 'styles', 'tokens.css'), 'utf8')
    for (const token of ALLOWED_TOKENS) {
      expect(tokens.includes(`${token}:`), `missing ${token}`).toBe(true)
    }
  })
})
