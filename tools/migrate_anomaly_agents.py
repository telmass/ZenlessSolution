"""Migrate the 12 unshipped Anomaly agents from the legacy snapshot tree.

The legacy project (`zzz-panelAndstrategy`) holds one official-WIKI scrape per
agent plus a hand-edited strategy TOML. This script copies them into `data/` so
the new pipeline can rebuild every generated artifact from committed sources:

  strategy/<slug>/data/<slug>.json          -> data/sources/<slug>.json
  strategy/<slug>/data/<slug>.strategy.toml -> data/guides/<slug>.toml
  data/catalog/agents.json                  -> data/sources/agents.json

Normalizations are explicit and recorded, never silent defaults:

  * `[_meta].role` / `oneLiner` / `tags` are filled from the curated table below
    (the legacy _meta has no display copy);
  * `[graduationPanelAlt.spec]` is rebuilt from the legacy build text when it is
    missing (only phoenix shipped one); the parsed counts are kept verbatim;
  * a top-level `officialGuide` is promoted from `_meta` when needed;
  * `[cinemaPriority]` is derived from the legacy 「影画要点」 lines when the
    guide names levels, otherwise recorded as "no key level";
  * a 「影画要点」 text section is synthesized from the official cinema text when
    the legacy guide has none, so every page ships the required section.

Run: python tools/migrate_anomaly_agents.py [--legacy-root C:\\code\\zzz-panelAndstrategy]
"""

from __future__ import annotations

import argparse
import json
import re
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "data" / "sources"
GUIDES = ROOT / "data" / "guides"

SLUGS = [
    "vivian",
    "alice",
    "grace",
    "aria",
    "promeia",
    "velina",
    "remielle",
    "jane",
    "burnice",
    "yanagi",
    "miyabi",
    "piper",
]

# Display copy for the guide lead. Derived from the official 「角色TAG」 /
# 「角色详情」 intro, then kept here so the TOML stays the single source.
CURATED: dict[str, dict] = {
    "vivian": {
        "role": "以太异常 · 后台紊乱",
        "oneLiner": "后台持续积蓄以太异常，并在敌人处于异常状态时结算异放，放大队伍紊乱伤害。",
        "tags": ["以太属性异常", "后台积蓄", "异放", "紊乱"],
    },
    "alice": {
        "role": "物理异常 · 爆发主C",
        "oneLiner": "以三段蓄力与极性强击快速结算物理异常与紊乱。",
        "tags": ["物理属性异常", "三段蓄力", "极性强击", "紊乱"],
    },
    "grace": {
        "role": "电异常 · 范围清杂",
        "oneLiner": "远程电属性异常，特殊技与终结技提供范围积蓄与清杂。",
        "tags": ["电属性异常", "范围输出", "快速异常"],
    },
    "aria": {
        "role": "以太异常 · 爆发主C",
        "oneLiner": "吸收应援能量快速蓄力，打出高频异放爆发。",
        "tags": ["以太属性异常", "蓄力输出", "异放"],
    },
    "promeia": {
        "role": "冰异常 · 异放核心",
        "oneLiner": "以霜刑驱动异放，并为全队异放提供增益。",
        "tags": ["冰属性异常", "异放", "全队异放增益"],
    },
    "velina": {
        "role": "风异常 · 后台副C",
        "oneLiner": "后台聚怪与降低积蓄抗性，靠初始回能转化伤害与异常掌控。",
        "tags": ["风属性异常", "后台输出", "聚怪", "减抗"],
    },
    "remielle": {
        "role": "流明异常 · 后场增伤",
        "oneLiner": "队友触发流明异化后从后场输出，并为全队增伤。",
        "tags": ["流明异常", "后场输出", "全队增伤"],
    },
    "jane": {
        "role": "物理异常 · 站场主C",
        "oneLiner": "靠高频攻击快速触发物理异常，进入狂热状态持续输出。",
        "tags": ["物理属性异常", "快速异常", "站场输出"],
    },
    "burnice": {
        "role": "火异常 · 后台紊乱",
        "oneLiner": "后台喷火积蓄火异常，靠燃点维持脱手输出与紊乱。",
        "tags": ["火属性异常", "后台输出", "紊乱"],
    },
    "yanagi": {
        "role": "电异常 · 紊乱爆发",
        "oneLiner": "切换特殊技获得电伤与穿透增益，靠强化特殊技与终结技爆发。",
        "tags": ["电属性异常", "快速异常", "紊乱", "穿透增益"],
    },
    "miyabi": {
        "role": "烈霜异常 · 直伤双修",
        "oneLiner": "烈霜积蓄可与任意属性触发紊乱，兼顾直伤与异常。",
        "tags": ["烈霜属性", "紊乱", "直伤双修"],
    },
    "piper": {
        "role": "物理异常 · 全队加伤",
        "oneLiner": "旋转斩击积攒动力，强化特殊技与终结技提供物理异常与全队增伤。",
        "tags": ["物理属性异常", "全队加伤", "清杂"],
    },
}

# Legacy catalog substat ids -> the panel contract ids.
SUBSTAT_MAP = {
    "am": "anomaly_proficiency",
    "pen_val": "pen_value",
    "cr": "crit_rate",
    "cd": "crit_dmg",
}

# Legacy core option id -> coreBonus field.
CORE_FIELDS = {
    "ac": "ac",
    "atk_base": "atkBase",
    "am": "am",
    "am_90": "am",
    "er_base": "erBase",
}
CORE_LEVELS = ["A", "B", "C", "D", "E", "F"]

# Legacy drive-disc substat display labels -> spec ids.
LABEL_TO_SUBSTAT = {
    "异常精通": "am",
    "攻击力%": "atk_pct",
    "小攻击": "atk_flat",
    "攻击力": "atk_flat",
    "穿透值": "pen_val",
    "穿透": "pen_val",
    "暴击率": "cr",
    "爆伤": "cd",
    "暴击伤害": "cd",
    "生命值%": "hp_pct",
    "小生命": "hp_flat",
    "小防御": "def_flat",
    "防御值%": "def_pct",
    "防御力%": "def_pct",
}
FILLER_ID = "hp_flat"


def core_bonus(core: list[dict]) -> list[dict]:
    """Cumulative per-rank bonus, matching the phoenix contract (A first)."""
    out: list[dict] = []
    for index, _rank in enumerate(CORE_LEVELS):
        row: dict[str, float] = {}
        for option in core:
            field = CORE_FIELDS[option["optionId"]]
            reached = sum(1 for rank in option["ranks"] if CORE_LEVELS.index(rank) <= index)
            value = round(reached * option["perRank"], 4)
            if value:
                row[field] = round(row.get(field, 0) + value, 4)
        out.append(row)
    return out


def toml_quote(text: str) -> str:
    return json.dumps(text, ensure_ascii=False)


def read_section(text: str, header: str) -> tuple[int, int] | None:
    lines = text.splitlines()
    try:
        start = next(i for i, line in enumerate(lines) if line.strip() == header)
    except StopIteration:
        return None
    end = start + 1
    while end < len(lines) and not lines[end].startswith("["):
        end += 1
    return start, end


def ensure_root_key(text: str, key: str, value: str) -> str:
    parsed = tomllib.loads(text)
    if parsed.get(key):
        return text
    lines = text.splitlines()
    insert_at = 0
    for index, line in enumerate(lines):
        if line.strip().startswith("["):
            break
        insert_at = index + 1
    lines.insert(insert_at, f"{key} = {toml_quote(value)}")
    return "\n".join(lines) + "\n"


def ensure_meta_copy(text: str, slug: str) -> tuple[str, list[str]]:
    parsed = tomllib.loads(text)
    meta = parsed["_meta"]
    curated = CURATED[slug]
    missing = [key for key in ("role", "oneLiner", "tags") if key not in meta]
    if not missing:
        return text, []
    span = read_section(text, "[_meta]")
    if not span:
        raise SystemExit(f"{slug}: [_meta] table missing")
    start, end = span
    lines = text.splitlines()
    insert_at = start + 1
    for index in range(start + 1, end):
        if lines[index].strip().startswith("name"):
            insert_at = index + 1
    block = []
    if "role" in missing:
        block.append(f"role = {toml_quote(curated['role'])}")
    if "oneLiner" in missing:
        block.append(f"oneLiner = {toml_quote(curated['oneLiner'])}")
    if "tags" in missing:
        block.append("tags = [" + ", ".join(toml_quote(tag) for tag in curated["tags"]) + "]")
    lines[insert_at:insert_at] = block
    return "\n".join(lines) + "\n", [f"_meta 缺展示字段，补 {', '.join(missing)}（按官方角色简介整理）"]


def parse_substat_text(text: str) -> tuple[list[dict], int, int | None]:
    counts: dict[str, int] = {}
    filler = 0
    for label, raw in re.findall(r"([\u4e00-\u9fa5%]+?)\s*×\s*(\d+)", text):
        label = label.strip()
        if "填充" in label:
            filler += int(raw)
            continue
        key = LABEL_TO_SUBSTAT.get(label)
        if not key:
            raise SystemExit(f"unknown substat label in graduation alt text: {label!r}")
        counts[key] = counts.get(key, 0) + int(raw)
    filler_match = re.search(r"填充\s*(\d+)\s*条", text)
    if filler_match:
        filler += int(filler_match.group(1))
    stated_match = re.match(r"^(\d+)\s*条", text.strip())
    stated = int(stated_match.group(1)) if stated_match else None
    sub_stats = [{"id": key, "count": value} for key, value in counts.items()]
    if filler:
        sub_stats.append({"id": FILLER_ID, "count": filler})
    return sub_stats, sum(item["count"] for item in sub_stats), stated


def strip_section(text: str, header: str) -> str:
    span = read_section(text, header)
    if not span:
        return text
    start, end = span
    lines = text.splitlines()
    del lines[start:end]
    while lines and not lines[-1].strip():
        lines.pop()
    return "\n".join(lines) + "\n"


def ensure_alt_spec(
    text: str, slug: str, snapshot: dict, rebuild: bool = False
) -> tuple[str, list[str]]:
    if rebuild:
        text = strip_section(text, "[graduationPanelAlt.spec]")
    parsed = tomllib.loads(text)
    alt = parsed.get("graduationPanelAlt") or {}
    if alt.get("spec"):
        budget = alt["spec"].get("budget")
        if budget is not None:
            return text, []
    full = (parsed.get("graduationPanel") or {}).get("spec")
    if not full:
        raise SystemExit(f"{slug}: graduationPanel.spec missing")

    if not alt:
        return text, []

    if not alt.get("spec"):
        raw = (alt.get("build") or {}).get("subStats", "")
        sub_stats, total, stated = parse_substat_text(raw)
        if not total:
            raise SystemExit(f"{slug}: cannot rebuild graduationPanelAlt.spec")
        spec = {
            "budget": total,
            "subStats": sub_stats,
            "core": full.get("core", []),
            "filler": 0,
        }
        for key in ("agentId", "weaponId", "refinement", "set4Id", "set2Id",
                    "disc4MainId", "disc5MainId", "disc6MainId", "disc5Element"):
            if key in full:
                spec[key] = full[key]
        block = ["[graduationPanelAlt.spec]"]
        block.append(f"budget = {total}")
        block.append("core = [" + ", ".join(toml_quote(item) for item in spec["core"]) + "]")
        block.append("filler = 0")
        for key in ("agentId", "weaponId", "set4Id", "set2Id", "disc4MainId",
                    "disc5MainId", "disc5Element", "disc6MainId"):
            if key in spec:
                value = spec[key]
                block.append(
                    f"{key} = {value}" if isinstance(value, int) else f"{key} = {toml_quote(value)}"
                )
        block.append("subStats = [")
        for item in sub_stats:
            block.append(f"  {{ id = {toml_quote(item['id'])}, count = {item['count']} }},")
        block.append("]")
        text = text.rstrip() + "\n\n" + "\n".join(block) + "\n"
        note = (
            f"graduationPanelAlt.spec 旧数据缺失，按 build.subStats 文本重建"
            f"（{total} 条，填充词条记为小生命，仅用于实算攻击/精通）"
        )
        if stated is not None and stated != total:
            note += f"；旧文本写「{stated} 条」与实际列出的 {total} 条不一致，按列出的条目计"
        return text, [note]

    # spec exists but the budget key is missing: derive it from the counts.
    spec = alt["spec"]
    total = sum(item["count"] for item in spec.get("subStats", []))
    if not total:
        return text, []
    span = read_section(text, "[graduationPanelAlt.spec]")
    assert span
    start, end = span
    lines = text.splitlines()
    insert_at = start + 1
    for index in range(start + 1, end):
        if lines[index].strip().startswith("filler"):
            insert_at = index + 1
            break
    lines.insert(insert_at, f"budget = {total}")
    note = f"graduationPanelAlt.spec.budget 旧数据缺失，按副词条总数补为 {total}"
    return "\n".join(lines) + "\n", [note]


# Legacy notes that described the old calculator's blind spots. The new panel
# engine models both 2-piece effects, so the sentences have to follow.
STALE_NOTE_REPLACEMENTS = {
    "vivian": [
        (
            "法厄同之歌 4 件的精通+45（强化特殊技触发）为局内、不进面板；自由蓝调 2 件的精通+30 选项表无对应项，--set2-effect none 显式不建模。",
            "法厄同之歌 4 件的精通+45（强化特殊技触发）为局内、不进面板；自由蓝调 2 件的异常精通 +30 已计入局外面板。",
        ),
        (
            "属性为以太，仓库暂无以太属性图标，页面 hero 处显示属性色牌兜底，不影响数值与机制展示。",
            "属性为以太，页面按以太元素图标与配色展示。",
        ),
    ],
    "burnice": [
        (
            "法厄同之歌 2 件的掌控+8% 选项表无对应项，--set2-effect none 显式不建模。",
            "自由蓝调 2 件的异常精通 +30 已计入局外面板。",
        )
    ],
    "jane": [
        (
            "獠牙重金属 4 件的队伍强击伤害 +35% 为局内，不计入面板；法厄同之歌 2 件掌控+8%（强化特殊技叠精通）为局内，不计入面板。",
            "獠牙重金属 4 件的队伍强击伤害 +35% 为局内，不计入面板；法厄同之歌 2 件的异常掌控 +8% 已计入局外面板。",
        )
    ],
    "yanagi": [
        (
            "法厄同之歌 2 件的掌控+8% 选项表无对应项，--set2-effect none 显式不建模。",
            "法厄同之歌 2 件的异常掌控 +8% 已计入局外面板。",
        )
    ],
}


def refresh_guide_notes(text: str, slug: str) -> tuple[str, list[str]]:
    replacements = STALE_NOTE_REPLACEMENTS.get(slug)
    if not replacements:
        return text, []
    notes: list[str] = []
    for old, new in replacements:
        if old in text:
            text = text.replace(old, new)
            notes.append("更正旧攻略中「未建模」的口径说明，改为当前面板引擎的实际行为")
    return text, notes


def fix_spec_sets(text: str, slug: str) -> tuple[str, list[str]]:
    parsed = tomllib.loads(text)
    builds = parsed.get("driveBuilds") or []
    if not builds:
        return text, []
    build = builds[0]
    notes: list[str] = []
    lines = text.splitlines()
    for header in ("[graduationPanel.spec]", "[graduationPanelAlt.spec]"):
        span = read_section(text, header)
        if not span:
            continue
        start, end = span
        section = tomllib.loads("\n".join([header] + lines[start + 1 : end]))
        spec = section.get("[graduationPanel.spec]") or section
        # tomllib path differs per header name; read the actual table instead.
        key = header.strip("[]").split(".")[0]
        spec = (parsed.get(key) or {}).get("spec") or {}
        if spec.get("set4Id") and spec.get("set4Id") == spec.get("set2Id"):
            replacement = {
                "set4Id": f'set4Id = {toml_quote(build["set4Id"])}',
                "set2Id": f'set2Id = {toml_quote(build["set2Id"])}',
            }
            for index in range(start + 1, end):
                for field, line in replacement.items():
                    if lines[index].strip().startswith(field + " "):
                        lines[index] = line
            notes.append(
                f"{key}.spec 的 4/2 件套是同一套，按攻略配装改为 "
                f"{build['set4Id']} + {build['set2Id']}"
            )
    if not notes:
        return text, []
    return "\n".join(lines) + "\n", notes


def ensure_cinema_priority(text: str, snapshot: dict) -> tuple[str, list[int]]:
    parsed = tomllib.loads(text)
    existing = parsed.get("cinemaPriority") or {}
    if existing.get("image"):
        # Editorially curated (miyabi ships a film still): keep it as-is.
        return text, list(existing.get("keyLevels", []))

    if "[cinemaPriority]" in text:
        text = strip_section(text, "[cinemaPriority]")
    note = "旧攻略未标注关键影画；六层均为数值/机制提升，按顺序阅读"
    text = text.rstrip() + "\n\n[cinemaPriority]\n"
    text += "keyLevels = []\n"
    text += f"note = {toml_quote(note)}\n"
    return text, []


def ensure_cinema_text(text: str, snapshot: dict) -> tuple[str, bool]:
    parsed = tomllib.loads(text)
    has = any(section.get("title") == "影画要点" for section in parsed.get("textGuide", []))
    if has:
        return text, False

    lines = []
    for cinema in snapshot["cinemas"]:
        effect = " ".join(cinema.get("effectText", "").split())
        lines.append(f"L{cinema['level']} {cinema['name']}：{effect}")
    block = ["[[textGuide]]", 'title = "影画要点"', "lines = ["]
    block += [f"  {toml_quote(line)}," for line in lines]
    block += ["]", ""]
    return text.rstrip() + "\n\n" + "\n".join(block), True


def migrate_guide(
    legacy: Path, slug: str, snapshot: dict, agent: dict, rebuild_alt: bool = False
) -> list[str]:
    target = GUIDES / f"{slug}.toml"
    if target.exists():
        existing = tomllib.loads(target.read_text(encoding="utf-8"))
        if (existing.get("_meta") or {}).get("authored"):
            return ["跳过：该角色攻略为人工重写（authored = true），迁移不覆盖"]
    text = legacy.read_text(encoding="utf-8")
    repairs: list[str] = []
    text = ensure_root_key(text, "officialGuide", snapshot["meta"]["source"])
    text, notes = ensure_meta_copy(text, slug)
    repairs.extend(notes)
    text, notes = ensure_alt_spec(text, slug, snapshot, rebuild=rebuild_alt)
    repairs.extend(notes)
    text, notes = refresh_guide_notes(text, slug)
    repairs.extend(notes)
    text, notes = fix_spec_sets(text, slug)
    repairs.extend(notes)
    text, _key_levels = ensure_cinema_priority(text, snapshot)
    text, added = ensure_cinema_text(text, snapshot)
    if added:
        repairs.append("补「影画要点」：按官方影画文本生成，逐条对应 L1–L6")

    target = GUIDES / f"{slug}.toml"
    target.write_text(text, encoding="utf-8")
    parsed = tomllib.loads(text)
    assert parsed["_meta"]["agentId"] == agent["id"], f"{slug}: agentId mismatch"
    assert parsed.get("officialGuide"), f"{slug}: officialGuide missing"
    return repairs


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--legacy-root",
        default=r"C:\code\zzz-panelAndstrategy",
        help="legacy project root that holds strategy/<slug>/data",
    )
    parser.add_argument(
        "--rebuild-alt",
        action="store_true",
        help="discard existing graduationPanelAlt.spec tables and rebuild them",
    )
    args = parser.parse_args()
    legacy_root = Path(args.legacy_root)
    if not (legacy_root / "strategy").exists():
        raise SystemExit(f"legacy strategy tree not found under {legacy_root}")

    legacy_catalog = {
        item["id"]: item
        for item in json.loads(
            (legacy_root / "data" / "catalog" / "agents.json").read_text(encoding="utf-8")
        )
    }
    roster = json.loads((SOURCES / "agents-index.json").read_text(encoding="utf-8"))
    roster_by_slug = {item["slug"]: item for item in roster}

    catalog: list[dict] = []
    report: dict[str, list[str]] = {}

    for slug in SLUGS:
        entry = roster_by_slug[slug]
        legacy_agent = legacy_catalog[entry["id"]]
        snapshot = json.loads(
            (legacy_root / "strategy" / slug / "data" / f"{slug}.json").read_text(
                encoding="utf-8"
            )
        )
        (SOURCES / f"{slug}.json").write_text(
            json.dumps(snapshot, ensure_ascii=False, indent=1), encoding="utf-8"
        )

        base = legacy_agent["base"]
        catalog.append(
            {
                "id": legacy_agent["id"],
                "name": legacy_agent["name"],
                "element": legacy_agent["element"],
                "rank": legacy_agent["rank"],
                "trait": legacy_agent["trait"],
                "panelMode": legacy_agent["panelMode"],
                "importantSubStats": [
                    SUBSTAT_MAP.get(item, item) for item in legacy_agent["importantSubStats"]
                ],
                "source": legacy_agent["source"],
                "base": {
                    "hp": base["hp"],
                    "atk": base["atk"],
                    "def": base["def"],
                    "impact": base["impact"],
                    "cr": base["cr"],
                    "cd": base["cd"],
                    "ac": base["ac"],
                    "am": base["am"],
                    "pr": base["pr"],
                    "er": base["er"],
                },
                "core": legacy_agent["core"],
                "coreBonus": core_bonus(legacy_agent["core"]),
            }
        )

        repairs = migrate_guide(
            legacy_root / "strategy" / slug / "data" / f"{slug}.strategy.toml",
            slug,
            snapshot,
            legacy_agent,
            rebuild_alt=args.rebuild_alt,
        )
        report[slug] = repairs
        print(f"  {slug}: snapshot + guide migrated ({len(repairs)} notes)")

    # Keep the already-shipped catalog entries (phoenix) and replace/add the 12.
    path = SOURCES / "agents.json"
    existing = json.loads(path.read_text(encoding="utf-8")) if path.exists() else []
    merged = {item["id"]: item for item in existing}
    for item in catalog:
        merged[item["id"]] = item
    merged_list = sorted(merged.values(), key=lambda item: item["id"])
    path.write_text(json.dumps(merged_list, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"agents.json: {len(merged_list)} entries")
    for slug, repairs in report.items():
        for item in repairs:
            print(f"  repair {slug}: {item}")


if __name__ == "__main__":
    main()
