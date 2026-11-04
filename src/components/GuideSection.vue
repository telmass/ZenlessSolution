<script setup lang="ts">
import { computed } from 'vue'
import type { Agent, GuideGraduation } from '@/types/agent'
import { media } from '@/lib/media'
import RichText from '@/components/RichText.vue'
import { analyzeSubstats, PHOENIX_PROFILE } from '@/core/substats'
import { computePanel } from '@/core/panel/compute'
import { graduation54, inputFromSpec } from '@/core/panel/presets'
import { computePhoenixDamage, enemyById } from '@/core/damage'

const props = defineProps<{ agent: Agent }>()

const guide = computed(() => props.agent.guide)

const substatLabels: Record<string, string> = {
  am: '异常精通',
  anomaly_proficiency: '异常精通',
  atk_pct: '攻击力%',
  atk_flat: '攻击力',
  pen_val: '穿透值',
  pen_value: '穿透值',
  hp_pct: '生命值%',
  crit_rate: '暴击率',
  crit_dmg: '暴击伤害',
  anomaly_mastery: '异常掌控',
}

function substatLabel(id: string): string {
  return substatLabels[id] ?? id
}

const builds = computed(() => guide.value.builds)
const firstBuild = computed(() => builds.value[0])

const graduationCards = computed(() =>
  [guide.value.graduation, guide.value.graduationAlt].filter((item): item is GuideGraduation => Boolean(item)),
)

const buildRows = (graduation: GuideGraduation) =>
  [
    { label: '代理人', value: graduation.build.agent },
    { label: '音擎', value: graduation.build.weapon },
    { label: '核心', value: graduation.build.core },
    { label: '驱动盘', value: `${graduation.build.set4 ?? ''} + ${graduation.build.set2 ?? ''}` },
    { label: '主词条', value: graduation.build.mainStats },
    { label: '副词条', value: graduation.build.subStats },
  ].filter((row) => row.value)

const effectiveCount = computed(() => {
  const spec = guide.value.graduation?.spec
  if (!spec?.subStats) return null
  return analyzeSubstats(graduationCounts(spec.subStats), PHOENIX_PROFILE, {
    budget: spec.budget,
  }).effective
})

const SUBSTAT_ID_MAP: Record<string, string> = {
  am: 'anomaly_proficiency',
  pen_val: 'pen_value',
}

function graduationCounts(subStats: { id: string; count: number }[]) {
  return Object.fromEntries(
    subStats.map((item) => [SUBSTAT_ID_MAP[item.id] ?? item.id, item.count]),
  )
}

function graduationAnalysis(item: GuideGraduation, includePenValue = false) {
  return analyzeSubstats(graduationCounts(item.spec.subStats ?? []), PHOENIX_PROFILE, {
    includePenValue,
    budget: item.spec.budget,
  })
}

const cinemaGains = computed(() => {
  const enemy = enemyById('standard')
  const panel = computePanel(inputFromSpec(props.agent, graduation54))
  const totals = [0, 1, 2, 4, 6].map((cinema) =>
    computePhoenixDamage(
      props.agent,
      panel.stats,
      { cinema, refinement: 1, coreLevel: 'F', engineId: 'ep-2259' },
      enemy,
    ).axis.total,
  )
  const steps = [1, 2, 4, 6]
  return Object.fromEntries(
    steps.map((level, index) => [level, totals[index + 1] / totals[index] - 1]),
  ) as Record<number, number>
})

function cinemaGain(line: string): { label: string; value: number; from: string } | null {
  const match = /^L([1246])\b/.exec(line)
  if (!match) return null
  const level = Number(match[1])
  const from = { 1: '0+1', 2: '1+1', 4: '2+1', 6: '4+1' }[level]
  return { label: `L${level}`, value: cinemaGains.value[level], from: from ?? '' }
}

function graduationLabel(item: GuideGraduation): string {
  const budget = item.spec.budget
  if (budget === 54) return '满配 · 54 词条'
  if (budget === 30) return '小毕业 · 30 词条'
  return item.title
}
</script>

<template>
  <div class="guide">
    <section class="guide__lead">
      <div>
        <h2>{{ guide.role }}</h2>
        <p class="guide__oneliner">{{ guide.oneLiner }}</p>
        <ul class="guide__tags">
          <li v-for="tag in guide.tags" :key="tag" class="tag tag--fire">{{ tag }}</li>
        </ul>
      </div>
      <div v-if="effectiveCount" class="guide__effective">
        <b class="num">{{ effectiveCount }}</b>
        <span>满配有效词条<br />异常精通 + 攻击力%</span>
      </div>
    </section>

    <section class="block">
      <h3>技能加点</h3>
      <div class="priority">
        <div v-for="(item, index) in guide.skillPriority" :key="item.key" class="priority__item">
          <img :src="`/assets/ui/skills/${item.key}.webp`" alt="" aria-hidden="true" />
          <div class="priority__text">
            <b>{{ item.label }}</b>
            <span class="num">{{ item.level }}<i>/{{ item.maxLevel }}</i></span>
          </div>
          <span v-if="index < guide.skillPriority.length - 1" class="priority__next" aria-hidden="true">
            {{ item.next || '·' }}
          </span>
        </div>
      </div>
    </section>

    <section class="block">
      <h3>音擎推荐</h3>
      <div class="weapon-table">
        <div v-for="(tier, index) in guide.weapons" :key="tier.tier" class="weapon-row">
          <div class="weapon-row__tier">
            <span class="num">0{{ index + 1 }}</span>
            <b>{{ tier.tier }}</b>
          </div>

          <div class="weapon-row__engines">
            <div v-for="item in tier.items" :key="item.name" class="weapon">
              <img v-if="media(item.icon)" :src="media(item.icon)" :alt="item.name" loading="lazy" />
              <div>
                <div class="weapon__name">
                  <b>{{ item.name }}</b>
                  <span class="weapon__refine num">精 {{ item.refinement }}</span>
                </div>
                <p>{{ item.stats }}</p>
              </div>
            </div>
          </div>

          <p v-if="tier.note" class="weapon-row__note">{{ tier.note }}</p>
        </div>
      </div>
    </section>

    <section v-if="firstBuild" class="block">
      <h3>驱动盘</h3>

      <div class="build">
        <h4 class="build__name">{{ firstBuild.name }}</h4>

        <div class="build__sets">
          <div class="set-card">
            <img v-if="media(firstBuild.set4.icon)" :src="media(firstBuild.set4.icon)" alt="" />
            <div>
              <span class="set-card__tag">4 件套</span>
              <b>{{ firstBuild.set4.name }}</b>
              <p>{{ firstBuild.set4.label }}</p>
            </div>
          </div>
          <div class="set-card">
            <img v-if="firstBuild.set2[0] && media(firstBuild.set2[0].icon)" :src="media(firstBuild.set2[0].icon)" alt="" />
            <div>
              <span class="set-card__tag">2 件套</span>
              <b>{{ firstBuild.set2.map((s) => s.name).join(' / ') }}</b>
              <p>{{ firstBuild.set2.map((s) => s.label).join('；') }}</p>
            </div>
          </div>
        </div>

        <div class="build__effects">
          <span class="build__label">4 件套效果</span>
          <p>{{ firstBuild.set4.effect4 }}</p>
          <p v-if="firstBuild.set4.scene" class="build__scene">搭配：{{ firstBuild.set4.scene }}</p>
        </div>

        <div class="build__stats">
          <span class="build__label">主词条</span>
          <div class="build__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>位置</th>
                  <th>推荐</th>
                  <th>备选</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="stat in firstBuild.mainStats" :key="stat.slot">
                  <td>{{ stat.slot }}</td>
                  <td class="is-main">{{ stat.main }}</td>
                  <td>{{ stat.alt || '—' }}</td>
                  <td class="muted">{{ stat.note || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="build__subs">
          <span class="build__label">副词条优先级</span>
          <ol class="subs">
            <li v-for="(item, index) in firstBuild.subPriority" :key="item.id">
              <span>{{ item.label }}</span>
              <i v-if="index < firstBuild.subPriority.length - 1" aria-hidden="true">
                {{ item.next || '>' }}
              </i>
            </li>
          </ol>
        </div>
      </div>
    </section>

    <section v-if="graduationCards.length" class="block">
      <h3>毕业面板</h3>
      <div class="graduations">
        <article v-for="item in graduationCards" :key="item.title" class="graduation">
          <header class="graduation__head">
            <h4>{{ graduationLabel(item) }}</h4>
            <span v-if="item.spec.budget" class="tag tag--accent">{{ item.spec.budget }} 词条</span>
          </header>
          <div class="graduation__totals">
            <div v-for="total in item.totals" :key="total.label">
              <span>{{ total.label }}</span>
              <b class="num">{{ total.value }}{{ total.unit }}</b>
            </div>
          </div>
          <dl class="graduation__rows">
            <div v-for="row in buildRows(item)" :key="row.label">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </div>
          </dl>
          <div v-if="item.spec.subStats" class="graduation__subs">
            <span class="build__label">词条分配</span>
            <ul>
              <li v-for="sub in item.spec.subStats" :key="sub.id">
                {{ substatLabel(sub.id) }}
                <b class="num">× {{ sub.count }}</b>
              </li>
            </ul>
          </div>
          <div class="graduation__effective">
            <span><b class="num">{{ graduationAnalysis(item).effective }}</b> 有效</span>
            <span>{{ graduationAnalysis(item).small }} 小</span>
            <span>{{ graduationAnalysis(item).invalid }} 无效</span>
            <em v-if="graduationAnalysis(item, true).effective !== graduationAnalysis(item).effective">
              含穿透 {{ graduationAnalysis(item, true).effective }} 有效
            </em>
          </div>
          <p class="graduation__note">{{ item.note }}</p>
        </article>
      </div>
    </section>

    <section class="block">
      <h3>队伍参考</h3>
      <div class="teams">
        <article v-for="team in guide.teams" :key="team.name" class="team">
          <h4>{{ team.name }}</h4>
          <ul class="team__members">
            <li v-for="member in team.members" :key="member.agentId">
              <img v-if="media(member.avatar)" :src="media(member.avatar)" :alt="member.name" loading="lazy" />
              <div class="team__member-body">
                <div class="team__member-head">
                  <b>{{ member.name }}</b>
                  <span class="tag">{{ member.role }}</span>
                </div>
                <p>{{ member.note }}</p>
                <div class="team__sets">
                  <span v-for="set in member.set4" :key="set.name" class="team__set">
                    <img v-if="media(set.icon)" :src="media(set.icon)" alt="" />
                    {{ set.name }}
                  </span>
                </div>
              </div>
            </li>
          </ul>
        </article>
      </div>
    </section>

    <section class="block">
      <h3>文字攻略</h3>
      <div class="texts">
        <article v-for="text in guide.texts" :key="text.title" class="text">
          <h4>{{ text.title }}</h4>
          <ol>
            <li v-for="(line, index) in text.lines" :key="index">
              <span
                v-if="text.title === '影画要点' && cinemaGain(line)"
                class="cinema-gain"
                :title="`相对 ${cinemaGain(line)!.from} 的 20s 轴总伤增量`"
              >
                {{ cinemaGain(line)!.label }}
                +{{ (cinemaGain(line)!.value * 100).toFixed(1) }}%
              </span>
              {{ line }}
            </li>
          </ol>
          <p v-if="text.title === '影画要点'" class="cinema-gain-note">
            百分比为 20s 参考轴相对上一影画的增量：0+1 → 1+1 → 2+1 → 4+1 → 6+1；技能 +2 未计入。
          </p>
        </article>
      </div>
    </section>

    <section class="block block--sources">
      <h3>数据来源</h3>
      <div class="sources">
        <a
          v-for="source in agent.sources"
          :key="source.url"
          :href="source.url"
          target="_blank"
          rel="noreferrer"
        >
          {{ source.label }} <span aria-hidden="true">↗</span>
        </a>
        <p class="muted">
          攻略内容整理自官方 WIKI 与官方玩法合集，并与旧版本地项目交叉核对；毕业面板为旧版计算器实算记录，
          新面板引擎接入后将重新复算。更新于 {{ agent.updatedAt }}。
        </p>
        <p v-for="repair in agent.repairs" :key="repair" class="sources__repair">
          数据修复：{{ repair }}
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.guide {
  display: grid;
  gap: var(--s8);
}

.guide__lead {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--s8);
  padding-bottom: var(--s5);
  border-bottom: 1px solid var(--line);
}

.guide__lead h2 {
  font-family: var(--font-display);
  font-size: clamp(2rem, 3.4vw, 2.75rem);
  font-weight: 700;
  letter-spacing: 0.03em;
  line-height: var(--lh-tight);
}

.guide__oneliner {
  max-width: 58ch;
  margin-top: var(--s3);
  color: var(--text-2);
  font-size: var(--fs-15);
}

.guide__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: var(--s4);
}

.guide__effective {
  flex-shrink: 0;
  text-align: right;
}

.guide__effective b {
  display: block;
  color: var(--accent);
  font-size: var(--fs-52);
  font-weight: 700;
  line-height: 0.9;
}

.guide__effective span {
  color: var(--muted);
  font-size: var(--fs-11);
  line-height: 1.5;
}

.block {
  min-width: 0;
}

.block + .block {
  padding-top: var(--s6);
  border-top: 1px solid var(--line);
}

.block h3 {
  margin-bottom: var(--s5);
  font-family: var(--font-display);
  font-size: var(--fs-22);
  font-weight: 600;
  letter-spacing: 0.04em;
}

.block h4 {
  font-family: var(--font-display);
  font-size: var(--fs-18);
  font-weight: 600;
  letter-spacing: 0.03em;
}

/* priority sequence */
.priority {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.priority__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 12px;
}

.priority__item + .priority__item {
  border-left: 1px solid var(--line);
}

.priority__item img {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.priority__text {
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}

.priority__text b {
  font-size: var(--fs-12);
  font-weight: 500;
}

.priority__text span {
  color: var(--accent);
  font-size: var(--fs-15);
}

.priority__text span i {
  color: var(--muted);
  font-size: var(--fs-11);
  font-style: normal;
}

.priority__next {
  position: absolute;
  right: -7px;
  z-index: 1;
  padding: 0 2px;
  background: var(--bg);
  color: var(--accent);
  font-family: var(--font-display);
  font-size: var(--fs-13);
}

/* engines */
.weapon-table {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: var(--s8);
  border-top: 1px solid var(--line);
}

.weapon-row {
  display: grid;
  /* Wide enough for the longest tier label ("其他限定下位") before the 44px icon. */
  grid-template-columns: 104px minmax(0, 1fr);
  gap: var(--s3);
  align-items: start;
  padding: var(--s4) 0;
  border-bottom: 1px solid var(--line);
}

.weapon-row__tier {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding-top: 3px;
}

.weapon-row__tier span {
  color: var(--accent);
  font-size: var(--fs-11);
  opacity: 0.7;
}

.weapon-row__tier b {
  color: var(--text);
  font-size: var(--fs-13);
  font-weight: 500;
  line-height: 1.35;
  white-space: normal;
  overflow-wrap: anywhere;
}

.weapon-row__engines {
  grid-column: 2;
  display: grid;
  gap: 10px;
}

.weapon {
  display: flex;
  gap: var(--s3);
  align-items: flex-start;
}

.weapon img {
  width: 44px;
  height: 44px;
  object-fit: contain;
  flex-shrink: 0;
}

.weapon__name {
  display: flex;
  align-items: baseline;
  gap: var(--s2);
}

.weapon__name b {
  font-size: var(--fs-15);
  font-weight: 500;
}

.weapon__refine {
  color: var(--muted);
  font-size: var(--fs-11);
}

.weapon p {
  margin-top: 2px;
  color: var(--muted);
  font-size: var(--fs-12);
}

.weapon-row__note {
  grid-column: 2;
  margin-top: 2px;
  color: var(--muted);
  font-size: var(--fs-12);
  line-height: 1.7;
}

/* drive discs */
.build {
  display: grid;
  gap: var(--s5);
  min-width: 0;
}

.build__name {
  font-size: var(--fs-18);
}

.build__sets {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s7);
  padding-top: var(--s4);
  border-top: 1px solid var(--line);
  min-width: 0;
}

.set-card {
  display: flex;
  gap: var(--s3);
}

.set-card img {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.set-card__tag {
  display: block;
  color: var(--fire);
  font-size: var(--fs-11);
  letter-spacing: 0.1em;
}

.set-card b {
  display: block;
  margin-top: 2px;
  font-size: var(--fs-15);
  font-weight: 500;
}

.set-card p {
  margin-top: 2px;
  color: var(--muted);
  font-size: var(--fs-12);
}

.build__effects {
  padding-top: var(--s4);
  border-top: 1px solid var(--line);
}

.build__label {
  display: block;
  margin-bottom: 6px;
  color: var(--muted);
  font-size: var(--fs-11);
  letter-spacing: 0.1em;
}

.build__effects p {
  max-width: 80ch;
  color: var(--text-2);
  font-size: var(--fs-13);
  line-height: 1.8;
}

.build__scene {
  margin-top: 4px;
  color: var(--muted) !important;
  font-size: var(--fs-12) !important;
}

.build__stats,
.build__subs {
  padding-top: var(--s4);
  border-top: 1px solid var(--line);
  min-width: 0;
}

.build__table-wrap {
  max-width: 100%;
  overflow-x: auto;
}

.build__stats table {
  width: 100%;
  min-width: 520px;
  border-collapse: collapse;
  font-size: var(--fs-12);
}

.build__stats th,
.build__stats td {
  padding: 9px 10px;
  border-bottom: 1px solid var(--line);
  text-align: left;
  white-space: nowrap;
}

.build__stats th {
  color: var(--muted);
  font-weight: 500;
  font-size: var(--fs-11);
}

.build__stats .is-main {
  color: var(--accent);
}

.subs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.subs li {
  display: flex;
  align-items: center;
  gap: 6px;
}

.subs li span {
  color: var(--text-2);
  font-size: var(--fs-12);
}

.subs li i {
  color: var(--accent);
  font-style: normal;
}

/* graduation */
.graduations {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s8);
}

.graduation {
  padding-top: var(--s4);
  border-top: 1px solid var(--line);
}

.graduation__head {  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s3);
}

.graduation__head h4 {
  font-size: var(--fs-15);
}

.graduation__totals {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s6);
  margin: var(--s4) 0;
  padding: var(--s4) 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.graduation__totals div {
  display: flex;
  flex-direction: column;
}

.graduation__totals span {
  color: var(--muted);
  font-size: var(--fs-11);
}

.graduation__totals b {
  color: var(--accent);
  font-size: var(--fs-28);
  font-weight: 700;
  line-height: 1.2;
}

.graduation__rows {
  display: grid;
  gap: 5px;
}

.graduation__rows > div {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: var(--s2);
  font-size: var(--fs-12);
}

.graduation__rows dt {
  color: var(--muted);
}

.graduation__rows dd {
  margin: 0;
  color: var(--text-2);
}

.graduation__subs {
  margin-top: var(--s3);
  padding-top: var(--s3);
  border-top: 1px solid var(--line);
}

.graduation__subs ul {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.graduation__subs li {
  color: var(--text-2);
  font-size: var(--fs-11);
  white-space: nowrap;
}

.graduation__subs li + li::before {
  content: "·";
  margin-right: 6px;
  color: var(--line-strong);
}

.graduation__subs li b {
  margin-left: 3px;
  color: var(--accent);
}

.graduation__effective {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 12px;
  margin-top: var(--s3);
  padding-top: var(--s2);
  border-top: 1px dashed var(--line);
  color: var(--muted);
  font-size: var(--fs-11);
}

.graduation__effective b {
  color: var(--accent);
  font-family: var(--font-display);
  font-size: var(--fs-16);
  font-weight: 600;
}

.graduation__effective em {
  margin-left: auto;
  color: var(--line-strong);
  font-size: 10px;
  font-style: normal;
}

.graduation__note {
  margin-top: var(--s3);
  color: var(--muted);
  font-size: var(--fs-11);
}

/* teams */
.teams {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s8);
}

.team {
  padding-top: var(--s4);
  border-top: 1px solid var(--line);
}

.team > h4 {
  font-size: var(--fs-15);
}

.team__members {
  display: grid;
}

.team__members > li {
  display: flex;
  gap: var(--s3);
  padding: var(--s3) 0;
  border-bottom: 1px solid var(--line);
}

.team__members img {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid var(--line-strong);
  object-fit: cover;
  flex-shrink: 0;
}

.team__member-head {
  display: flex;
  align-items: baseline;
  gap: var(--s2);
}

.team__member-head b {
  font-size: var(--fs-13);
  font-weight: 500;
}

.team__member-body p {
  color: var(--muted);
  font-size: var(--fs-12);
  line-height: 1.7;
}

.team__sets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.team__set {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-2);
  font-size: var(--fs-11);
}

.team__set img {
  width: 16px;
  height: 16px;
  border: 0;
}

/* text guide */
.texts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--s7);
}

.text {
  padding-top: var(--s4);
  border-top: 1px solid var(--line);
}

.text h4 {
  font-size: var(--fs-15);
}

.text ol {
  display: grid;
  gap: 8px;
  margin-top: var(--s3);
}

.text li {
  color: var(--text-2);
  font-size: var(--fs-13);
  line-height: 1.8;
}

.cinema-gain {
  display: inline-block;
  margin-right: 6px;
  padding: 0 5px;
  background: var(--accent);
  color: var(--accent-ink);
  font-family: var(--font-display);
  font-size: var(--fs-12);
  font-weight: 700;
  line-height: 1.6;
  vertical-align: 1px;
}

.cinema-gain-note {
  margin-top: var(--s2);
  color: var(--muted);
  font-size: 10px;
  line-height: 1.7;
}

/* sources */
.sources {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 18px;
}

.sources a {
  color: var(--accent);
  font-size: var(--fs-12);
  border-bottom: 1px solid rgba(240, 223, 78, 0.35);
}

.sources p {
  width: 100%;
  font-size: var(--fs-11);
  line-height: 1.8;
}

.sources__repair {
  color: #c9a94a;
}

@media (max-width: 1080px) {
  .priority {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .priority__item + .priority__item {
    border-left: 0;
    border-top: 1px solid var(--line);
  }

  .weapon-table {
    grid-template-columns: 1fr;
  }

  .weapon-row {
    grid-template-columns: 104px minmax(0, 1fr);
    gap: var(--s3) var(--s5);
  }

  .weapon-row__note {
    grid-column: 2;
  }

  .texts {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .guide__lead {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--s4);
  }

  .guide__effective {
    display: flex;
    align-items: baseline;
    gap: 10px;
    text-align: left;
  }

  .guide__effective b {
    font-size: var(--fs-36);
  }

  .build__sets,
  .graduations,
  .teams {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .priority {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .weapon-row {
    grid-template-columns: 1fr;
  }

  .weapon-row__engines,
  .weapon-row__note {
    grid-column: 1;
  }

  .build__stats table {
    min-width: 460px;
  }
}
</style>
