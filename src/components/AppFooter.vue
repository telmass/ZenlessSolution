<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="footer__inner container">
      <div class="footer__brand">
        <span class="footer__mark" aria-hidden="true"></span>
        <div>
          <b>ZENLESS SOLUTION</b>
          <p>绝区零图鉴复刻与代理人攻略 · 菲欧妮先行版</p>
        </div>
      </div>

      <div class="footer__meta">
        <p>
          数据来源：
          <a href="https://baike.mihoyo.com/zzz/wiki/content/2216/detail" target="_blank" rel="noreferrer">
            官方 WIKI
          </a>
          ·
          <a href="https://baike.mihoyo.com/zzz/wiki/channel/map/66/68" target="_blank" rel="noreferrer">
            官方玩法合集
          </a>
        </p>
        <p class="muted">
          非商业资料整理；游戏素材版权归 miHoYo 所有。更新于 2026-11-04 · © {{ year }} ZenlessSolution
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: 80px;
  border-top: 1px solid var(--line);
  background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.35));
}

.footer__inner {
  display: flex;
  justify-content: space-between;
  gap: 32px;
  padding: 34px 0 40px;
}

.footer__brand {
  display: flex;
  gap: 12px;
}

.footer__mark {
  width: 14px;
  height: 14px;
  margin-top: 5px;
  background: var(--accent);
  clip-path: polygon(0 0, 100% 0, 100% 60%, 60% 100%, 0 100%);
}

.footer__brand b {
  font-family: var(--font-display);
  font-size: 13px;
  letter-spacing: 0.16em;
}

.footer__brand p {
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
}

.footer__meta {
  text-align: right;
  color: var(--text-2);
  font-size: 12px;
}

.footer__meta a {
  color: var(--text);
  border-bottom: 1px solid var(--line-strong);
}

.footer__meta a:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.footer__meta .muted {
  margin-top: 6px;
  font-size: 11px;
}

@media (max-width: 760px) {
  .footer__inner {
    flex-direction: column;
  }

  .footer__meta {
    text-align: left;
  }
}
</style>
