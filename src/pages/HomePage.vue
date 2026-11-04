<script setup lang="ts">
import phoenix from '@/data/agents/phoenix.json'
import type { Agent } from '@/types/agent'
import { media, mediaColor } from '@/lib/media'

const agent = phoenix as unknown as Agent
</script>

<template>
  <div class="home">
    <section class="hero">
      <div
        class="hero__wash"
        :style="{ backgroundImage: `url(${media(agent.assets.full)})` }"
        aria-hidden="true"
      ></div>
      <div class="hero__grid container">
        <div class="hero__copy">
          <p class="eyebrow">Character File · No.001</p>
          <h1>
            {{ agent.name }}
            <span>{{ agent.fullName.split('·')[1] ?? '' }}</span>
          </h1>
          <p class="hero__role">
            <span class="tag tag--fire">火属性</span>
            <span class="tag">异常</span>
            <span class="tag tag--accent">S 级</span>
            <span class="hero__faction">坎卜斯黑枝</span>
          </p>
          <p class="hero__intro">
            以「灼蚀」放大全队异常伤害，靠「异放」结算爆发。首个完整复刻的代理人档案：
            基础面板、六个技能组、六张影画，以及加点、音擎、驱动盘、队伍与毕业面板。
          </p>
          <div class="hero__actions">
            <RouterLink to="/agents/phoenix" class="btn btn--primary">
              进入代理人档案
              <span aria-hidden="true">→</span>
            </RouterLink>
            <RouterLink to="/agents/phoenix#guide" class="btn btn--ghost">
              直接看攻略
            </RouterLink>
          </div>
          <dl class="hero__stats">
            <div>
              <dt>攻击力</dt>
              <dd class="num">{{ agent.base.atk }}</dd>
            </div>
            <div>
              <dt>异常精通</dt>
              <dd class="num">{{ agent.base.anomalyProficiency }}</dd>
            </div>
            <div>
              <dt>异常掌控</dt>
              <dd class="num">{{ agent.base.anomalyMastery }}</dd>
            </div>
            <div>
              <dt>影画关键</dt>
              <dd class="num">1 / 6</dd>
            </div>
          </dl>
        </div>

        <div class="hero__art">
          <div class="hero__ring" aria-hidden="true"></div>
          <img
            :src="media(agent.assets.tachie)"
            :alt="`${agent.fullName} 立绘`"
            class="hero__portrait"
            fetchpriority="high"
          />
          <div class="hero__badge">
            <span class="num">S</span>
            <small>RANK</small>
          </div>
          <div class="hero__caption">
            <span>PHOENIX</span>
            <b>坎卜斯黑枝 · 异常</b>
          </div>
        </div>
      </div>
    </section>

    <section class="section container">
      <div class="section-title">
        <h2>本次复刻</h2>
        <small>VERTICAL SLICE · 菲欧妮</small>
      </div>

      <div class="feature-grid">
        <RouterLink to="/agents/phoenix" class="feature card">
          <span class="feature__index num">01</span>
          <div class="feature__avatar" :style="{ background: mediaColor(agent.assets.avatar) }">
            <img :src="media(agent.assets.avatar)" :alt="agent.name" />
          </div>
          <h3>角色档案</h3>
          <p>60 级基础面板、核心技 A–F、六个技能组与 1–16 级成长表、六张影画。</p>
          <span class="feature__link">浏览档案 →</span>
        </RouterLink>

        <RouterLink to="/agents/phoenix#skills" class="feature card">
          <span class="feature__index num">02</span>
          <h3>技能与影画</h3>
          <p>18 个招式、逐级倍率、核心被动「涅槃」的七档数值，影画 1 / 6 关键节点。</p>
          <span class="feature__link">查看技能 →</span>
        </RouterLink>

        <RouterLink to="/agents/phoenix#guide" class="feature card">
          <span class="feature__index num">03</span>
          <h3>攻略与配装</h3>
          <p>加点顺序、四档音擎、自由蓝调 4+2、毕业面板 54 / 30 词条、两支队伍与出招表。</p>
          <span class="feature__link">阅读攻略 →</span>
        </RouterLink>
      </div>
    </section>

    <section class="section container">
      <div class="section-title">
        <h2>图鉴</h2>
        <small>W-ENGINE / DRIVE DISC / BANGBOO</small>
      </div>

      <div class="feature-grid">
        <RouterLink to="/engines" class="feature card">
          <span class="feature__index num">01</span>
          <h3>音擎</h3>
          <p>101 把音擎的基础攻击、高级属性与精炼 1–5 特效。</p>
          <span class="feature__link">浏览音擎 →</span>
        </RouterLink>

        <RouterLink to="/drives" class="feature card">
          <span class="feature__index num">02</span>
          <h3>驱动盘</h3>
          <p>30 套驱动盘的二件套 / 四件套效果与主词条池。</p>
          <span class="feature__link">浏览驱动盘 →</span>
        </RouterLink>

        <RouterLink to="/bangboo" class="feature card">
          <span class="feature__index num">03</span>
          <h3>邦布</h3>
          <p>42 只邦布的评级、基础属性、代号与档案描述。</p>
          <span class="feature__link">浏览邦布 →</span>
        </RouterLink>
      </div>
    </section>

    <section class="section container roadmap">
      <div class="section-title">
        <h2>建设进度</h2>
        <small>ROADMAP</small>
      </div>
      <ul class="roadmap__list">
        <li class="is-done"><b>M0</b> 站点骨架与设计令牌</li>
        <li class="is-done"><b>M1</b> 菲欧妮数据与本地 WebP 资产</li>
        <li class="is-done"><b>M2</b> 代理人档案 / 技能 / 影画 / 攻略</li>
        <li class="is-done"><b>M3</b> 音擎 / 驱动盘 / 邦布图鉴</li>
        <li class="is-done"><b>M4</b> 面板计算器与毕业面板</li>
        <li><b>M5</b> 有效词条与 0+1 配置对比</li>
        <li><b>M6</b> 其余代理人接入</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--line);
}

.hero__wash {
  position: absolute;
  inset: -10% -10% auto auto;
  width: 70%;
  height: 130%;
  background-size: cover;
  background-position: center top;
  opacity: 0.18;
  filter: blur(2px) saturate(0.9);
  mask-image: linear-gradient(90deg, transparent, #000 30%, #000 75%, transparent);
  pointer-events: none;
}

.hero__grid {
  position: relative;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 40px;
  align-items: center;
  min-height: 620px;
  padding: 68px 0 60px;
}

.hero__copy h1 {
  margin: 18px 0 14px;
  font-family: var(--font-display);
  font-size: clamp(56px, 7vw, 92px);
  font-weight: 800;
  line-height: 0.98;
  letter-spacing: 0.02em;
}

.hero__copy h1 span {
  display: block;
  margin-top: 8px;
  color: var(--text-2);
  font-size: clamp(18px, 2vw, 24px);
  font-weight: 400;
  letter-spacing: 0.4em;
}

.hero__role {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 22px;
}

.hero__faction {
  margin-left: 6px;
  color: var(--muted);
  font-size: 13px;
  letter-spacing: 0.08em;
}

.hero__intro {
  max-width: 52ch;
  color: var(--text-2);
  font-size: 15px;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 30px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 13px 22px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.04em;
  transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn--primary {
  background: var(--accent);
  color: var(--accent-ink);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%);
}

.btn--primary:hover {
  background: #fff06a;
}

.btn--ghost {
  border: 1px solid var(--line-strong);
  color: var(--text);
}

.btn--ghost:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.hero__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin: 42px 0 0;
  padding-top: 22px;
  border-top: 1px solid var(--line);
}

.hero__stats dt {
  color: var(--muted);
  font-size: 11px;
  letter-spacing: 0.12em;
}

.hero__stats dd {
  margin: 4px 0 0;
  font-size: 24px;
  font-weight: 600;
}

.hero__art {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  min-height: 520px;
}

.hero__ring {
  position: absolute;
  width: min(430px, 82%);
  aspect-ratio: 1;
  border: 1px solid rgba(242, 225, 76, 0.18);
  border-radius: 50%;
  top: 8%;
  box-shadow: inset 0 0 80px rgba(255, 106, 61, 0.12);
}

.hero__ring::after {
  content: "";
  position: absolute;
  inset: 16px;
  border: 1px dashed rgba(255, 106, 61, 0.16);
  border-radius: 50%;
}

.hero__portrait {
  position: relative;
  z-index: 1;
  width: min(480px, 96%);
  max-height: 580px;
  object-fit: contain;
  object-position: bottom;
  filter: drop-shadow(0 30px 50px rgba(0, 0, 0, 0.6));
  mask-image: linear-gradient(180deg, #000 78%, transparent 100%);
}

.hero__badge {
  position: absolute;
  z-index: 2;
  top: 16%;
  right: 4%;
  display: grid;
  place-items: center;
  width: 74px;
  height: 74px;
  background: var(--accent);
  color: var(--accent-ink);
  clip-path: polygon(0 0, 100% 0, 100% 72%, 72% 100%, 0 100%);
}

.hero__badge span {
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 800;
  line-height: 1;
}

.hero__badge small {
  font-size: 9px;
  letter-spacing: 0.18em;
}

.hero__caption {
  position: absolute;
  z-index: 2;
  left: 0;
  bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: 14px;
  border-left: 2px solid var(--fire);
}

.hero__caption span {
  color: var(--fire);
  font-family: var(--font-display);
  font-size: 11px;
  letter-spacing: 0.28em;
}

.hero__caption b {
  color: var(--text-2);
  font-size: 12px;
  font-weight: 400;
}

.section {
  padding-top: 72px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.feature {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 26px;
  overflow: hidden;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.feature:hover {
  border-color: var(--line-strong);
  transform: translateY(-2px);
}

.feature__index {
  position: absolute;
  top: 18px;
  right: 22px;
  color: #2e2e3a;
  font-size: 44px;
  font-weight: 700;
  line-height: 1;
}

.feature__avatar {
  width: 56px;
  height: 56px;
  overflow: hidden;
  border-radius: 50%;
  border: 1px solid var(--line-strong);
}

.feature__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.feature h3 {
  font-family: var(--font-display);
  font-size: 19px;
  letter-spacing: 0.03em;
}

.feature p {
  color: var(--muted);
  font-size: 13px;
}

.feature__link {
  margin-top: auto;
  padding-top: 16px;
  color: var(--accent);
  font-size: 12px;
  letter-spacing: 0.08em;
}

.roadmap__list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px 24px;
}

.roadmap__list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--line);
  color: var(--muted);
  font-size: 13px;
}

.roadmap__list li b {
  color: var(--text-2);
  font-family: var(--font-display);
  font-size: 12px;
  letter-spacing: 0.08em;
}

.roadmap__list li.is-done {
  color: var(--text-2);
}

.roadmap__list li.is-done b {
  color: var(--accent);
}

@media (max-width: 1000px) {
  .hero__grid {
    grid-template-columns: 1fr;
    min-height: 0;
  }

  .hero__art {
    order: -1;
    min-height: 380px;
  }

  .hero__portrait {
    max-height: 430px;
  }

  .feature-grid,
  .roadmap__list {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 680px) {
  .hero__stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .feature-grid,
  .roadmap__list {
    grid-template-columns: 1fr;
  }
}
</style>

