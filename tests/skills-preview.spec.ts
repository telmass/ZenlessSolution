import { describe, expect, it } from 'vitest'
import agentJson from '@/data/agents/phoenix.json'
import type { Agent, AgentMove } from '@/types/agent'
import { movePreview } from '@/core/skills/preview'

const agent = agentJson as unknown as Agent
const moves = agent.skills.flatMap((skill) => skill.moves)

function findMove(title: string): AgentMove {
  const move = moves.find((item) => item.title === title)
  if (!move) throw new Error(`missing move: ${title}`)
  return move
}

describe('skill move preview', () => {
  it('reads the level-12 first damage and impact rows', () => {
    const preview = movePreview(findMove('普通攻击：裁生'))
    expect(preview.damage).toBe('32.1%')
    expect(preview.impact).toBe('19.8%')
    expect(preview.hits).toBe(4)
  })

  it('keeps single-hit moves without a hit count', () => {
    const preview = movePreview(findMove('强化特殊技：燎斩'))
    expect(preview.damage).toBe('761.1%')
    expect(preview.impact).toBe('385.1%')
    expect(preview.hits).toBeUndefined()
  })

  it('returns nothing for moves without a growth table', () => {
    const preview = movePreview(findMove('额外能力：黑枝王牌'))
    expect(preview).toEqual({})
  })
})
