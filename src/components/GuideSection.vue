<script setup lang="ts">
import { computed } from 'vue'
import type { Agent, GuideGraduation } from '@/types/agent'
import { media } from '@/lib/media'
import RichText from '@/components/RichText.vue'

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
  const effective = new Set(['am', 'anomaly_proficiency', 'atk_pct'])
  return spec.subStats
    .filter((item) => effective.has(item.id))
    .reduce((total, item) => total + item.count, 0)
})
</script>

<template>
  <div class="guide">
    <section class="guide__hero">
      <div>
        <p class="eyebrow">Build Guide · Phoenix</p>
        <h2>{{ guide.role }}</h2>
        <p class="guide__oneliner">{{ guide.oneLiner }}</p>
        <ul class="guide__tags">
          <li v-for="tag in guide.tags" :key="tag" class="tag tag--fire">{{ tag }}</li>
        </ul>
      </div>
      <div v-if="effectiveCount" class="guide__effective">
        <span class="num">{{ effectiveCount }}</span>
        <small>满配有效词条<br />（异常精通 + 攻击力%）</small>
      </div>
    </section>

    <section class="block">
      <header class="block__head">
        <span class="block__index num">01</span>
        <h3>技能加点</h3>
        <small>PRIORITY</small>
      </header>
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
      <header class="block__head">
        <span class="block__index num">02</span>
        <h3>音擎推荐</h3>
        <small>W-ENGINE</small>
      </header>
      <div class="weapons">
        <article v-for="tier in guide.weapons" :key="tier.tier" class="weapon-tier card">
          <header>
            <h4>{{ tier.tier }}</h4>
            <p v-if="tier.note">{{ tier.note }}</p>
          </header>
          <div class="weapon-tier__items">
            <div v-for="item in tier.items" :key="item.name" class="weapon">
              <img v-if="media(item.icon)" :src="media(item.icon)" :alt="item.name" loading="lazy" />
              <div>
                <div class="weapon__name">
                  <b>{{ item.name }}</b>
                  <span class="tag">精 {{ item.refinement }}</span>
                </div>
                <p>{{ item.stats }}</p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section v-if="firstBuild" class="block">
      <header class="block__head">
        <span class="block__index num">03</span>
        <h3>驱动盘</h3>
        <small>DRIVE DISC · 4+2</small>
      </header>

      <div class="build card">
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
          <div class="set-card set-card--two">
            <img v-if="firstBuild.set2[0] && media(firstBuild.set2[0].icon)" :src="media(firstBuild.set2[0].icon)" alt="" />
            <div>
              <span class="set-card__tag">2 件套</span>
              <b>{{ firstBuild.set2.map((s) => s.name).join(' / ') }}</b>
              <p>{{ firstBuild.set2.map((s) => s.label).join('；') }}</p>
            </div>
          </div>
        </div>

        <div class="build__effects">
          <div>
            <span class="build__label">4 件套效果</span>
            <p>{{ firstBuild.set4.effect4 }}</p>
            <p v-if="firstBuild.set4.scene" class="build__scene">搭配：{{ firstBuild.set4.scene }}</p>
          </div>
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
      <header class="block__head">
        <span class="block__index num">04</span>
        <h3>毕业面板</h3>
        <small>REFERENCE PANEL</small>
      </header>
      <div class="graduations">
        <article v-for="item in graduationCards" :key="item.title" class="graduation card">
          <header class="graduation__head">
            <h4>{{ item.title }}</h4>
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
          <p class="graduation__note">{{ item.note }}</p>
        </article>
      </div>
    </section>

    <section class="block">
      <header class="block__head">
        <span class="block__index num">05</span>
        <h3>队伍参考</h3>
        <small>TEAM</small>
      </header>
      <div class="teams">
        <article v-for="team in guide.teams" :key="team.name" class="team card">
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
      <header class="block__head">
        <span class="block__index num">06</span>
        <h3>文字攻略</h3>
        <small>ROTATION &amp; NOTES</small>
      </header>
      <div class="texts">
        <article v-for="text in guide.texts" :key="text.title" class="text card">
          <h4>{{ text.title }}</h4>
          <ol>
            <li v-for="(line, index) in text.lines" :key="index">{{ line }}</li>
          </ol>
        </article>
      </div>
    </section>

    <section class="block">
      <header class="block__head">
        <span class="block__index num">07</span>
        <h3>数据来源</h3>
        <small>SOURCES</small>
      </header>
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
  grid-template-columns: minmax(0, 1fr);
  gap: 48px;
}

.guide > * {
  min-width: 0;
}

.guide__hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 30px;
  padding: 8px 0 4px;
}

.guide__hero h2 {
  margin-top: 10px;
  font-family: var(--font-display);
  font-size: clamp(30px, 4vw, 44px);
  letter-spacing: 0.03em;
}

.guide__oneliner {
  max-width: 58ch;
  margin-top: 10px;
  color: var(--text-2);
}

.guide__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
}

.guide__effective {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  padding: 14px 20px;
  border: 1px solid rgba(242, 225, 76, 0.3);
  background: var(--accent-soft);
}

.guide__effective span {
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 42px;
  font-weight: 800;
  line-height: 1;
}

.guide__effective small {
  color: var(--text-2);
  font-size: 11px;
  line-height: 1.5;
}

.block__head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 18px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
}

.block__index {
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.block__head h3 {
  font-family: var(--font-display);
  font-size: 21px;
  letter-spacing: 0.04em;
}

.block__head small {
  margin-left: auto;
  color: var(--muted);
  font-family: var(--font-display);
  font-size: 10px;
  letter-spacing: 0.18em;
}

.priority {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 2px;
  background: var(--line);
  border: 1px solid var(--line);
}

.priority__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  background: var(--surface);
}

.priority__item img {
  width: 26px;
  height: 26px;
}

.priority__text {
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}

.priority__text b {
  font-size: 12px;
  font-weight: 500;
}

.priority__text span {
  color: var(--accent);
  font-size: 14px;
}

.priority__text span i {
  color: var(--muted);
  font-size: 10px;
  font-style: normal;
}

.priority__next {
  position: absolute;
  right: -8px;
  z-index: 1;
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 14px;
}

.weapons {
  display: grid;
  gap: 12px;
}

.weapon-tier {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 24px;
  padding: 20px 22px;
}

.weapon-tier header h4 {
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 15px;
  letter-spacing: 0.06em;
}

.weapon-tier header p {
  margin-top: 8px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.75;
}

.weapon-tier__items {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.weapon {
  display: flex;
  flex: 1 1 260px;
  gap: 12px;
  padding: 10px;
  border: 1px solid var(--line);
  background: var(--bg-soft);
}

.weapon img {
  width: 54px;
  height: 54px;
  object-fit: contain;
  flex-shrink: 0;
}

.weapon__name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.weapon__name b {
  font-size: 13px;
}

.weapon p {
  margin-top: 3px;
  color: var(--muted);
  font-size: 11px;
}

.build {
  padding: 24px 26px;
}

.build__name {
  font-family: var(--font-display);
  font-size: 19px;
  letter-spacing: 0.03em;
}

.build__sets {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 16px;
}

.set-card {
  display: flex;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--line);
  background: var(--bg-soft);
}

.set-card img {
  width: 46px;
  height: 46px;
  object-fit: contain;
}

.set-card__tag {
  display: block;
  color: var(--fire);
  font-size: 10px;
  letter-spacing: 0.14em;
}

.set-card b {
  display: block;
  margin-top: 2px;
  font-size: 14px;
}

.set-card p {
  margin-top: 3px;
  color: var(--muted);
  font-size: 11px;
}

.build__effects {
  margin-top: 16px;
  padding: 14px 16px;
  border-left: 2px solid var(--fire);
  background: rgba(255, 106, 61, 0.04);
}

.build__label {
  display: block;
  margin-bottom: 6px;
  color: var(--muted);
  font-family: var(--font-display);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.build__effects p {
  color: var(--text-2);
  font-size: 13px;
  line-height: 1.8;
}

.build__scene {
  margin-top: 4px;
  color: var(--muted) !important;
  font-size: 12px !important;
}

.build__stats {
  margin-top: 20px;
}

.build__table-wrap {
  max-width: 100%;
  overflow-x: auto;
}

.build__stats table {
  width: 100%;
  min-width: 460px;
  border-collapse: collapse;
  font-size: 12px;
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
  font-size: 11px;
}

.build__stats .is-main {
  color: var(--accent);
}

.build__subs {
  margin-top: 20px;
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
  padding: 4px 10px;
  border: 1px solid var(--line-strong);
  border-radius: 2px;
  font-size: 12px;
}

.subs li i {
  color: var(--accent);
  font-style: normal;
}

.graduations {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.graduation {
  padding: 22px 24px;
}

.graduation__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.graduation__head h4 {
  font-family: var(--font-display);
  font-size: 17px;
}

.graduation__totals {
  display: flex;
  flex-wrap: wrap;
  gap: 26px;
  margin: 16px 0;
  padding: 14px 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.graduation__totals div {
  display: flex;
  flex-direction: column;
}

.graduation__totals span {
  color: var(--muted);
  font-size: 11px;
}

.graduation__totals b {
  color: var(--accent);
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
}

.graduation__rows {
  display: grid;
  gap: 6px;
}

.graduation__rows > div {
  display: grid;
  grid-template-columns: 68px 1fr;
  gap: 8px;
  font-size: 12px;
}

.graduation__rows dt {
  color: var(--muted);
}

.graduation__rows dd {
  margin: 0;
  color: var(--text-2);
}

.graduation__subs {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--line);
}

.graduation__subs ul {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.graduation__subs li {
  padding: 3px 8px;
  border: 1px solid var(--line);
  font-size: 11px;
  color: var(--text-2);
  white-space: nowrap;
}

.graduation__subs li b {
  color: var(--accent);
  margin-left: 4px;
}

.graduation__note {
  margin-top: 12px;
  color: var(--muted);
  font-size: 11px;
}

.teams {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.team {
  padding: 20px 22px;
}

.team > h4 {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
  font-family: var(--font-display);
  font-size: 16px;
}

.team__members {
  display: grid;
  gap: 14px;
  margin-top: 14px;
}

.team__members > li {
  display: flex;
  gap: 12px;
}

.team__members img {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 1px solid var(--line-strong);
  object-fit: cover;
  flex-shrink: 0;
}

.team__member-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.team__member-head b {
  font-size: 13px;
}

.team__member-body p {
  color: var(--muted);
  font-size: 11px;
  line-height: 1.7;
}

.team__sets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.team__set {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-2);
  font-size: 10px;
}

.team__set img {
  width: 18px;
  height: 18px;
  border-radius: 2px;
  border: 0;
}

.texts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.text {
  padding: 20px 22px;
}

.text h4 {
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
  font-family: var(--font-display);
  font-size: 15px;
}

.text ol {
  display: grid;
  gap: 9px;
  margin-top: 12px;
}

.text li {
  color: var(--text-2);
  font-size: 12px;
  line-height: 1.8;
}

.sources {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 18px;
}

.sources a {
  color: var(--accent);
  font-size: 12px;
  border-bottom: 1px solid rgba(242, 225, 76, 0.35);
}

.sources p {
  width: 100%;
  font-size: 11px;
  line-height: 1.8;
}

.sources__repair {
  color: #c9a94a;
}

@media (max-width: 1060px) {
  .priority {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .weapon-tier {
    grid-template-columns: 1fr;
  }

  .texts {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .guide__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .build__sets,
  .graduations,
  .teams {
    grid-template-columns: 1fr;
  }

  .weapon-tier__items {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .priority {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .build,
  .team,
  .text,
  .graduation {
    padding: 16px;
  }
}
</style>
