# 05 攻略草案 · 确认流程

05（配装 / 攻略）的事实密度高、最容易来回改，因此固定为「先草案、后确认、再落库」：

1. 在 `docs/reviews/<slug>-05-build.md` 写草案（模板见 `_template-05-build.md`）。
2. 逐条核对：engineId、套装名、主词条 id、词条分配能否用 `fromCounts` 展开成 6×4×9。
3. 需求方确认后，才写入 `data/guides/<slug>.toml` 的 05 段落；`[_meta].preAudit` 记录确认时间与结论。
4. 未确认前不把该角色 `available` 置 true（页面不展示未确认的 05）。
5. 变更记录进 `docs/changelog.md`。
