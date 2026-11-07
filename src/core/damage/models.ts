import type { Agent } from '@/types/agent'
import type { PanelStats } from '@/core/panel/types'
import type { DamageBuild } from './snapshot'
import { computePhoenixDamage, computeSingleRelease } from './axis'
import { computeVivianDamage, computeVivianSingle } from './vivian'
import { computeAliceDamage, computeAliceSingle } from './alice'
import { computeAriaDamage, computeAriaSingle } from './aria'
import type { AgentDamage, CritMode, DamageResult, EnemyPreset } from './types'

/** Dispatch the 20s axis to the agent's damage model. */
export function computeAgentDamage(
  agent: Agent,
  panel: PanelStats,
  build: DamageBuild,
  enemy: EnemyPreset,
): AgentDamage {
  if (agent.damageModel === 'vivian') {
    return computeVivianDamage(agent, panel, build, enemy)
  }
  if (agent.damageModel === 'phoenix') {
    return computePhoenixDamage(agent, panel, build, enemy)
  }
  if (agent.damageModel === 'alice') {
    return computeAliceDamage(agent, panel, build, enemy)
  }
  if (agent.damageModel === 'aria') {
    return computeAriaDamage(agent, panel, build, enemy)
  }
  throw new Error(`${agent.slug}: no damage model registered`)
}

/** Single-hit card; only meaningful for agents with a damage model. */
export function computeAgentSingle(
  agent: Agent,
  panel: PanelStats,
  build: DamageBuild,
  enemy: EnemyPreset,
  critMode: CritMode = 'expected',
): DamageResult {
  if (agent.damageModel === 'vivian') {
    return computeVivianSingle(agent, panel, build, enemy, critMode)
  }
  if (agent.damageModel === 'phoenix') {
    return computeSingleRelease(agent, panel, build, enemy, critMode)
  }
  if (agent.damageModel === 'alice') {
    return computeAliceSingle(agent, panel, build, enemy, critMode)
  }
  if (agent.damageModel === 'aria') {
    return computeAriaSingle(agent, panel, build, enemy, critMode)
  }
  throw new Error(`${agent.slug}: no damage model registered`)
}
