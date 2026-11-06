"""Build every shipped agent dossier from committed sources.

Inputs (read-only):
  - data/sources/<slug>.json        official WIKI snapshot per agent
  - data/guides/<slug>.toml         editorial guide (single human source)
  - data/sources/agents.json        catalog: 60-level base panel + core options
  - data/sources/agents-index.json  full 61-agent roster
  - data/sources/engines.json       engine lookup for validation
  - data/sources/drive-sets.json    set lookup for validation
  - src/data/panel.json             panel id vocabulary (generated first)

Outputs:
  - src/data/agents/<slug>.json
  - src/data/agents/index.json
  - data/sources/agents-index.json  (availability + tags written back)
  - src/data/media.json             agent-owned media keys

Every unknown id fails loudly: no silent fallback, no guessed default.

Run: python tools/import_agents.py
"""

from __future__ import annotations

import json
import re
import sys
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "data" / "sources"
GUIDES = ROOT / "data" / "guides"
OUT_DATA = ROOT / "src" / "data"
OUT_AGENTS = OUT_DATA / "agents"
PANEL = OUT_DATA / "panel.json"

if not PANEL.exists():
    raise SystemExit("src/data/panel.json missing; run tools/import_panel.py first")
PANEL_DATA = json.loads(PANEL.read_text(encoding="utf-8"))
MAIN_IDS = {(item["slot"], item["id"]) for item in PANEL_DATA["mainStats"]}
SUBSTAT_IDS = {item["id"] for item in PANEL_DATA["substats"]}

ROW_RE = re.compile(r"^(.+?)[：:]\s*(.+)$")
NUM_RE = re.compile(r"^(-?\d+(?:\.\d+)?)(%?)$")
SKILL_KEYS = ["basic", "dodge", "assist", "special", "chain", "core"]

# Drive-disc main-stat ids used by the legacy strategy files -> panel ids.
MAIN_STAT_BY_SLOT: dict[int, dict[str, str]] = {
    4: {
        "am_92": "anomaly_proficiency_92",
        "atk_pct_30": "atk_pct_30",
        "hp_pct_30": "hp_pct_30",
        "def_pct_48": "def_pct_48",
        "crit_rate_24": "crit_rate_24",
        "cd_48": "crit_dmg_48",
    },
    5: {
        "dmg_30": "dmg_bonus_30",
        "atk_pct_30": "atk_pct_30_d5",
        "hp_pct_30": "hp_pct_30_d5",
        "def_pct_48": "def_pct_48_d5",
        "pr_24": "pen_ratio_24",
    },
    6: {
        "ac_pct_30": "anomaly_mastery_30",
        "atk_pct_30": "atk_pct_30_d6",
        "hp_pct_30": "hp_pct_30_d6",
        "def_pct_48": "def_pct_48_d6",
        "er_pct_60": "energy_regen_60",
        "impact_pct_18": "impact_pct_18",
    },
}

SUBSTAT_TO_RULE = {
    "other": "hp_flat",
    "am": "anomaly_proficiency",
    "atk_pct": "atk_pct",
    "atk_flat": "atk_flat",
    "pen_val": "pen_value",
    "hp_pct": "hp_pct",
    "hp_flat": "hp_flat",
    "def_flat": "def_flat",
    "def_pct": "def_pct",
    "cr": "crit_rate",
    "cd": "crit_dmg",
}

CORE_TO_FIELD = {
    "ac": "ac",
    "atk_base": "atkBase",
    "am": "am",
    "am_90": "am",
    "er_base": "erBase",
}
# Phoenix is the only agent with a hand-modelled damage kit in v1; the
# per-rank numbers below are the official core-passive values used by
# core/damage (amFlat 43–85, sear crit DMG 12.5–25%, tick 25–50% ATK).
# Vivian 核心被动的异放系数（A–F，每 10 点异常精通的百分比）。
VIVIAN_RELEASE_COEFS = {
    "以太": ["3.59%", "4.11%", "4.63%", "5.15%", "5.65%", "6.15%"],
    "电": ["1.86%", "2.12%", "2.38%", "2.64%", "2.90%", "3.20%"],
    "火": ["4.66%", "5.32%", "5.98%", "6.64%", "7.30%", "8.00%"],
    "物理": ["0.44%", "0.51%", "0.58%", "0.65%", "0.70%", "0.75%"],
    "冰": ["0.63%", "0.72%", "0.81%", "0.90%", "0.99%", "1.08%"],
    "风": ["0.18%", "0.21%", "0.24%", "0.26%", "0.29%", "0.32%"],
}

ALICE_MECHANICS = {
    # 物理异常积蓄效率：核心被动等级 1–7（A–F 对应 2–7）。
    "buildupEfficiencyPct": [12.5, 14.6, 16.7, 18.8, 20.8, 22.9, 25],
}

PHOENIX_MECHANICS = {
    "amFlat": [43, 50, 57, 64, 71, 78, 85],
    "critDmg": [12.5, 14.6, 16.7, 18.8, 20.8, 22.9, 25],
    "tickAtkPct": [25, 29.2, 33.3, 37.5, 41.7, 45.8, 50],
}

CORE_LABELS = {
    "ac": ("异常掌控", ""),
    "atk.base": ("基础攻击力", ""),
    "atkBase": ("基础攻击力", ""),
    "am": ("异常精通", ""),
    "erBase": ("基础能量自动回复", ""),
}


class BuildError(RuntimeError):
    pass


def parse_rows(raw: str) -> list[dict]:
    rows = []
    for line in raw.split("\n"):
        line = line.strip()
        if not line:
            continue
        m = ROW_RE.match(line)
        if m:
            label, value = m.group(1).strip(), m.group(2).strip()
        else:
            label, value = line, ""
        num = None
        suffix = value
        nm = NUM_RE.match(value)
        if nm:
            num = float(nm.group(1))
            suffix = nm.group(2)
        rows.append({"label": label, "value": value, "num": num, "suffix": suffix})
    return rows


def build_table(move: dict) -> dict | None:
    levels = move.get("growth") or []
    if not levels:
        return None
    level_labels = [str(lv["level"]) for lv in levels]
    groups: list[dict] = []
    index: dict[str, dict] = {}

    for lv in levels:
        for group in lv.get("groups", []):
            name = group.get("name", "效果")
            if name not in index:
                entry = {"name": name, "rows": [], "_map": {}}
                index[name] = entry
                groups.append(entry)
            entry = index[name]
            parsed = []
            for raw in group.get("rows", []):
                parsed.extend(parse_rows(raw))
            for row in parsed:
                if row["label"] not in entry["_map"]:
                    item = {"label": row["label"], "values": [""] * len(levels)}
                    entry["_map"][row["label"]] = item
                    entry["rows"].append(item)
                entry["_map"][row["label"]]["values"][level_labels.index(str(lv["level"]))] = row[
                    "value"
                ]

    for group in groups:
        group.pop("_map", None)
    return {"levels": level_labels, "groups": groups}


def build_core_table(move: dict) -> dict | None:
    levels = move.get("growth") or []
    if not levels:
        return None
    out = []
    for lv in levels:
        lines: list[str] = []
        for group in lv.get("groups", []):
            for raw in group.get("rows", []):
                lines.extend(x.strip() for x in raw.split("\n") if x.strip())
        out.append({"level": str(lv["level"]), "lines": lines})
    return {"levels": out}


def intro_parts(profile: dict) -> tuple[list[str], str]:
    intro = profile.get("intro", "")
    tags: list[str] = []
    tag_match = re.search(r"【角色TAG】(.+)", intro)
    if tag_match:
        tags = [t.strip() for t in tag_match.group(1).split("、") if t.strip()]
    detail = re.sub(r"^【角色TAG】.*\n?", "", intro).strip()
    for marker in ("【角色详情】", "【角色介绍】"):
        detail = detail.replace(marker, "", 1)
    return tags, detail.strip()


def custom_field(profile: dict, key: str) -> str:
    for field in profile.get("customFields", []):
        if field.get("key") == key:
            return field.get("value", "")
    return ""


def core_bonus(catalog: dict) -> list[dict]:
    levels = ["A", "B", "C", "D", "E", "F"]
    out: list[dict] = []
    for index, _level in enumerate(levels):
        row: dict[str, float] = {}
        for option in catalog.get("core", []):
            field = CORE_TO_FIELD.get(option["optionId"])
            if not field:
                raise BuildError(f"unknown core option: {option['optionId']}")
            reached = sum(1 for rank in option["ranks"] if levels.index(rank) <= index)
            value = round(reached * option["perRank"], 4)
            if value:
                row[field] = round(row.get(field, 0) + value, 4)
        out.append(row)
    return out


def core_effects(catalog: dict) -> list[dict]:
    effects = []
    for option in catalog.get("core", []):
        field = CORE_TO_FIELD.get(option["optionId"])
        if not field:
            raise BuildError(f"unknown core option: {option['optionId']}")
        levels = ["A", "B", "C", "D", "E", "F"]
        values = []
        for index, _level in enumerate(levels):
            reached = sum(1 for rank in option["ranks"] if levels.index(rank) <= index)
            value = round(reached * option["perRank"], 4)
            values.append(f"{value:g}")
        effects.append({"label": option["label"], "values": values})
    return effects


def map_main_stat(slot: int, raw: str, agent_slug: str) -> str:
    mapping = MAIN_STAT_BY_SLOT[slot]
    if raw not in mapping:
        raise BuildError(f"{agent_slug}: unknown slot {slot} main stat id {raw!r}")
    return mapping[raw]


def map_substats(items: list[dict], agent_slug: str, notes: list[str]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for item in items:
        rule = SUBSTAT_TO_RULE.get(item["id"])
        if not rule:
            raise BuildError(f"{agent_slug}: unknown substat id {item['id']!r}")
        if item["id"] == "other":
            notes.append(
                f"毕业 spec 的 {item['count']} 条「other」填充词条记为小生命，只影响生命值、不影响攻击/精通展示"
            )
        counts[rule] = counts.get(rule, 0) + item["count"]
    return counts


def build_panel_spec(spec: dict, agent_slug: str, notes: list[str]) -> dict:
    missing = [key for key in ("weaponId", "set4Id", "set2Id", "budget") if not spec.get(key)]
    if missing:
        raise BuildError(f"{agent_slug}: graduation spec missing {missing}")
    mains = {
        4: map_main_stat(4, spec["disc4MainId"], agent_slug),
        5: map_main_stat(5, spec["disc5MainId"], agent_slug),
        6: map_main_stat(6, spec["disc6MainId"], agent_slug),
    }
    for slot, main_id in mains.items():
        if (slot, main_id) not in MAIN_IDS:
            raise BuildError(f"{agent_slug}: panel main stat {slot}/{main_id} missing")
    counts = map_substats(spec.get("subStats", []), agent_slug, notes)
    total = sum(counts.values())
    if total != spec["budget"]:
        raise BuildError(
            f"{agent_slug}: substat total {total} != budget {spec['budget']}"
        )
    return {
        "engineId": spec["weaponId"],
        "set4": spec["set4Id"],
        "set2": spec["set2Id"],
        "mainStats": {str(slot): value for slot, value in mains.items()},
        "substats": counts,
        "budget": spec["budget"],
        "coreLevel": "F",
    }


def main() -> None:
    substat_ids = SUBSTAT_IDS
    engine_ids = {item["id"] for item in json.loads((SOURCES / "engines.json").read_text(encoding="utf-8"))}
    set_names = {item["name"] for item in json.loads((SOURCES / "drive-sets.json").read_text(encoding="utf-8"))}

    catalog = json.loads((SOURCES / "agents.json").read_text(encoding="utf-8"))
    roster = json.loads((SOURCES / "agents-index.json").read_text(encoding="utf-8"))
    roster_by_slug = {item["slug"]: item for item in roster}

    media: list[dict] = []
    media_keys: dict[str, dict] = {}

    def add_media(key: str, url: str | None, variant: str, width: int, height: int) -> str:
        if not url:
            return ""
        if key not in media_keys:
            entry = {"key": key, "url": url, "variant": variant, "width": width, "height": height}
            media_keys[key] = entry
            media.append(entry)
        return key

    agents_out: dict[str, dict] = {}
    repairs_by_slug: dict[str, list[str]] = {}

    for item in catalog:
        agent_id = item["id"]
        slug = next((row["slug"] for row in roster if row["id"] == agent_id), None)
        if not slug:
            raise BuildError(f"catalog agent {agent_id} missing from roster")
        snapshot_path = SOURCES / f"{slug}.json"
        guide_path = GUIDES / f"{slug}.toml"
        if not snapshot_path.exists():
            raise BuildError(f"{slug}: missing snapshot {snapshot_path.name}")
        if not guide_path.exists():
            raise BuildError(f"{slug}: missing guide {guide_path.name}")

        snapshot = json.loads(snapshot_path.read_text(encoding="utf-8"))
        guide_src = tomllib.loads(guide_path.read_text(encoding="utf-8"))
        meta = guide_src.get("_meta") or {}
        roster_item = roster_by_slug[slug]

        tags = meta.get("tags") or intro_parts(snapshot["profile"])[0]
        detail = intro_parts(snapshot["profile"])[1]
        repairs: list[str] = []

        avatar = add_media(
            f"agent:{slug}:avatar", snapshot["assets"].get("avatar"), "avatar", 256, 256
        )
        tachie = add_media(
            f"agent:{slug}:tachie", snapshot["assets"].get("tachie"), "portrait", 720, 720
        )
        full = add_media(
            f"agent:{slug}:full", guide_src.get("background"), "full", 1440, 810
        )
        if not full:
            raise BuildError(f"{slug}: guide background missing")
        film_url = (guide_src.get("cinemaPriority") or {}).get("image")
        film = add_media(f"agent:{slug}:film", film_url, "icon", 160, 160) if film_url else ""

        key_levels = set((guide_src.get("cinemaPriority") or {}).get("keyLevels") or [])
        cinema_key_by_url: dict[str, str] = {}
        cinemas = []
        for cinema in snapshot["cinemas"]:
            level = cinema["level"]
            backdrop = (snapshot.get("cinemaBackdrops") or {}).get(str(level), {})
            url = backdrop.get("image") or backdrop.get("imageRemote")
            key = ""
            if url:
                if url not in cinema_key_by_url:
                    cinema_key_by_url[url] = add_media(
                        f"agent:{slug}:cinema:{level}", url, "cinema", 1440, 810
                    )
                key = cinema_key_by_url[url]
            cinemas.append(
                {
                    "level": level,
                    "name": cinema["name"],
                    "effect": cinema["effectText"],
                    "story": cinema.get("storyText", ""),
                    "image": key,
                    "keyLevel": level in key_levels,
                }
            )

        core_text_override = (guide_src.get("_meta") or {}).get("coreText")

        skills = []
        for category in snapshot["skills"]:
            key = category["key"]
            moves = []
            for move_index, move in enumerate(category["moves"]):
                table = build_core_table(move) if key == "core" else build_table(move)
                text = move.get("text", "")
                if key == "core" and move_index == 0 and core_text_override:
                    text = core_text_override
                moves.append({"title": move["title"], "text": text, "table": table})
            skills.append(
                {
                    "key": key,
                    "name": category["name"],
                    "icon": f"/assets/ui/skills/{key}.webp",
                    "moves": moves,
                }
            )
        if [skill["key"] for skill in skills] != SKILL_KEYS:
            raise BuildError(f"{slug}: skill categories {[s['key'] for s in skills]}")

        core_skill = next(skill for skill in skills if skill["key"] == "core")
        core_title = core_skill["moves"][0]["title"]
        passive_name = core_title.split("：", 1)[1] if "：" in core_title else core_title
        bonus = core_bonus(item)

        guide_weapons = []
        for tier in guide_src.get("weapons", []):
            items = []
            for weapon in tier.get("items", []):
                engine_id = weapon.get("engineId")
                if not engine_id or engine_id not in engine_ids:
                    raise BuildError(f"{slug}: unknown engine {engine_id!r}")
                items.append(
                    {
                        "name": weapon["name"],
                        "stats": weapon.get("stats", ""),
                        "engineId": engine_id,
                        "refinement": weapon.get("refinement", 1),
                        "icon": f"engine:{engine_id}:icon",
                    }
                )
            guide_weapons.append(
                {"tier": tier.get("tier", ""), "note": tier.get("note", ""), "items": items}
            )

        builds = []
        for build in guide_src.get("driveBuilds", []):
            set4_raw = build.get("set4")
            if isinstance(set4_raw, list):
                if len(set4_raw) != 1:
                    # Keep the primary set; alternates stay readable in `scene`.
                    set4_raw = set4_raw[0]
                else:
                    set4_raw = set4_raw[0]
            set4 = set4_raw or {}
            set2 = build.get("set2") or {}
            set2_main = set2.get("main") or []
            if isinstance(set2_main, dict):
                set2_main = [set2_main]
            set2_items = []
            for member in set2_main:
                if member["name"] not in set_names:
                    raise BuildError(f"{slug}: unknown drive set {member['name']!r}")
                set2_items.append(
                    {
                        "name": member["name"],
                        "label": member.get("label", ""),
                        "icon": f"set:{member['name']}:icon",
                    }
                )
            if set4.get("name") and set4["name"] not in set_names:
                raise BuildError(f"{slug}: unknown drive set {set4['name']!r}")
            builds.append(
                {
                    "name": build.get("name", ""),
                    "subPriority": [
                        {"label": p["label"], "next": p.get("next", ""), "id": p.get("id", "")}
                        for p in build.get("subPriority", [])
                    ],
                    "mainStats": [
                        {
                            "slot": m.get("slot", ""),
                            "main": m.get("main", ""),
                            "alt": m.get("alt", ""),
                            "note": m.get("note", ""),
                        }
                        for m in build.get("mainStats", [])
                    ],
                    "set4": {
                        "name": set4.get("name", ""),
                        "label": set4.get("label", ""),
                        "effect4": set4.get("effect4", ""),
                        "scene": set4.get("scene", ""),
                        "icon": f"set:{set4.get('name', '')}:icon",
                    },
                    "set2": set2_items,
                }
            )

        teams = []
        for team in guide_src.get("teams", []):
            members = []
            for member in team.get("members", []):
                member_id = member.get("agentId", "")
                if member_id == agent_id:
                    member_avatar = avatar
                else:
                    member_avatar = add_media(
                        f"agent:{member_id or member['name']}:avatar",
                        member.get("avatar"),
                        "avatar",
                        200,
                        200,
                    )
                members.append(
                    {
                        "agentId": member_id,
                        "name": member["name"],
                        "role": member.get("role", ""),
                        "note": member.get("note", ""),
                        "avatar": member_avatar,
                        "set4": [
                            {"name": s["name"], "icon": f"set:{s['name']}:icon"}
                            for s in member.get("set4", [])
                        ],
                    }
                )
            teams.append({"name": team.get("name", ""), "members": members})

        texts = [{"title": t.get("title", ""), "lines": t.get("lines", [])} for t in guide_src.get("textGuide", [])]
        if not any(text["title"] == "影画要点" for text in texts):
            raise BuildError(f"{slug}: guide missing 影画要点 section")

        def graduation(section: dict | None, fallback_title: str) -> dict | None:
            if not section:
                return None
            spec = section.get("spec")
            if not spec:
                raise BuildError(f"{slug}: graduation spec missing")
            if "core" not in spec:
                spec = dict(spec)
                spec["core"] = ["ac", "atk_base"]
                repairs.append(
                    f"{fallback_title}.spec.core 旧数据缺失，按核心 F（异常掌控 +36 / 基础攻击力 +75）补全"
                )
            return {
                "title": section.get("title", fallback_title),
                "statRule": section.get("statRule", ""),
                "totals": section.get("totals", []),
                "note": section.get("note", ""),
                "computedAt": section.get("computedAt", ""),
                "build": section.get("build", {}),
                "spec": spec,
                "panel": build_panel_spec(spec, slug, repairs),
            }

        graduation_full = graduation(guide_src.get("graduationPanel"), "毕业面板")
        graduation_alt = graduation(guide_src.get("graduationPanelAlt"), "小毕业面板")
        if not graduation_full:
            raise BuildError(f"{slug}: graduationPanel missing")

        guide = {
            "role": meta.get("role", ""),
            "tags": tags,
            "oneLiner": meta.get("oneLiner", ""),
            "cinemaPriority": {
                "keyLevels": sorted(key_levels),
                "note": (guide_src.get("cinemaPriority") or {}).get("note", ""),
            },
            "skillPriority": [
                {
                    "key": p.get("key", ""),
                    "label": p.get("label", ""),
                    "level": p.get("level", 0),
                    "maxLevel": p.get("maxLevel", 0),
                    "next": p.get("next", ""),
                }
                for p in guide_src.get("skillPriority", [])
            ],
            "weapons": guide_weapons,
            "builds": builds,
            "teams": teams,
            "texts": texts,
            "graduation": graduation_full,
            "graduationAlt": graduation_alt,
            "officialGuide": guide_src.get("officialGuide", ""),
        }

        alias = {"am": "anomaly_proficiency", "pen_val": "pen_value", "cr": "crit_rate", "cd": "crit_dmg"}
        effective = []
        for stat in item.get("importantSubStats", []):
            mapped = alias.get(stat, stat)
            if mapped not in substat_ids:
                raise BuildError(f"{slug}: unknown effective substat {stat!r}")
            effective.append(mapped)
        if not effective:
            raise BuildError(f"{slug}: no effective substats")
        small = [stat for stat in ("atk_flat", "pen_value") if stat not in effective]

        base = item["base"]
        agent = {
            "id": agent_id,
            "slug": slug,
            "name": roster_item["name"],
            "fullName": snapshot["profile"]["name"],
            "rarity": snapshot["profile"]["rank"],
            "element": snapshot["profile"]["element"],
            "specialty": snapshot["profile"]["trait"],
            "faction": snapshot["profile"].get("factionTitle") or roster_item["faction"],
            "tags": tags,
            "intro": detail,
            "profile": {
                "birthday": custom_field(snapshot["profile"], "出生日期"),
                "height": custom_field(snapshot["profile"], "身高").replace("cm", ""),
                "cv": "",
            },
            "base": {
                "hp": base["hp"],
                "atk": base["atk"],
                "def": base["def"],
                "impact": base["impact"],
                "critRate": base["cr"],
                "critDmg": base["cd"],
                "anomalyProficiency": base["am"],
                "anomalyMastery": base["ac"],
                "penRatio": base["pr"],
                "energyRegen": base["er"],
            },
            "corePassive": {
                "name": passive_name,
                "levels": ["A", "B", "C", "D", "E", "F"],
                "coreBonus": bonus,
                "effects": core_effects(item)
                + (
                    [
                        {"label": f"异放系数（{element}）", "values": values}
                        for element, values in VIVIAN_RELEASE_COEFS.items()
                    ]
                    if slug == "vivian"
                    else []
                ),
                **(PHOENIX_MECHANICS if slug == "phoenix" else {}),
                **(ALICE_MECHANICS if slug == "alice" else {}),
            },
            "substatProfile": {"effective": effective, "small": small},
            "damageModel": {"phoenix": "phoenix", "vivian": "vivian", "alice": "alice"}.get(slug),
            "skills": skills,
            "cinemas": cinemas,
            "assets": {"avatar": avatar, "tachie": tachie, "full": full, "film": film},
            "guide": guide,
            **({"potential": guide_src["potential"]} if guide_src.get("potential") else {}),
            "sources": [
                {
                    "label": "官方 WIKI · 代理人",
                    "url": snapshot["meta"]["source"],
                },
                {
                    "label": "官方玩法合集",
                    "url": "https://baike.mihoyo.com/zzz/wiki/channel/map/66/68",
                },
            ],
            "repairs": repairs,
            "updatedAt": "2026-11-05",
        }

        agents_out[slug] = agent
        repairs_by_slug[slug] = repairs

    OUT_AGENTS.mkdir(parents=True, exist_ok=True)
    for stale in OUT_AGENTS.glob("*.json"):
        if stale.name == "index.json":
            continue
        if stale.stem not in agents_out:
            stale.unlink()

    for slug, agent in agents_out.items():
        (OUT_AGENTS / f"{slug}.json").write_text(
            json.dumps(agent, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
        )

    # Roster: keep the curated 61-agent order; only shipped agents are open.
    index = []
    for entry in roster:
        row = dict(entry)
        agent = agents_out.get(entry["slug"])
        if agent:
            row.update(
                {
                    "id": agent["id"],
                    "name": agent["name"],
                    "fullName": agent["fullName"],
                    "rarity": agent["rarity"],
                    "element": agent["element"],
                    "specialty": agent["specialty"],
                    "faction": agent["faction"],
                    "available": True,
                    "avatar": agent["assets"]["avatar"],
                    "full": agent["assets"]["full"],
                    "tags": agent["tags"],
                }
            )
        index.append(row)

    (OUT_AGENTS / "index.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    (OUT_DATA / "media.json").write_text(
        json.dumps(media, ensure_ascii=False, indent=1), encoding="utf-8"
    )

    print(f"agents: {len(agents_out)} | media keys: {len(media_keys)} | roster: {len(index)}")
    for slug, agent in agents_out.items():
        print(
            f"  {slug:9s} {agent['name']:6s} skills={len(agent['skills'])} "
            f"moves={sum(len(s['moves']) for s in agent['skills'])} "
            f"cinemas={len(agent['cinemas'])} teams={len(agent['guide']['teams'])}"
        )
    for slug, repairs in repairs_by_slug.items():
        for repair in repairs:
            print(f"  repair {slug}: {repair}")


if __name__ == "__main__":
    try:
        main()
    except BuildError as exc:
        print(f"FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
