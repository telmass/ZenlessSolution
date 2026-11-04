"""Import Fioni (phoenix) from the checked-in source snapshots into the app contract.

Sources (read-only):
  - data/sources/phoenix.json          (official wiki scrape, legacy snapshot)
  - data/guides/phoenix.toml           (editorial guide, legacy v2 shape)
  - data/sources/agents.json           (catalog subset: base stats / core options)

Outputs:
  - src/data/agents/phoenix.json
  - src/data/agents/index.json
  - src/data/media.json (media key -> source URL + target variant)

Run: python tools/import_phoenix.py
"""

from __future__ import annotations

import hashlib
import json
import re
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "data" / "sources"
GUIDES = ROOT / "data" / "guides"

OUT_DATA = ROOT / "src" / "data"
OUT_AGENTS = OUT_DATA / "agents"

ROW_RE = re.compile(r"^(.+?)[：:]\s*(.+)$")
NUM_RE = re.compile(r"^(-?\d+(?:\.\d+)?)(%?)$")


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
                entry["_map"][row["label"]]["values"][level_labels.index(str(lv["level"]))] = row["value"]

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


def load_media(entries: list[dict]) -> None:
    OUT_DATA.mkdir(parents=True, exist_ok=True)
    (OUT_DATA / "media.json").write_text(
        json.dumps(entries, ensure_ascii=False, indent=1), encoding="utf-8"
    )


def main() -> None:
    phoenix = json.loads((SOURCES / "phoenix.json").read_text(encoding="utf-8"))
    strategy = tomllib.loads((GUIDES / "phoenix.toml").read_text(encoding="utf-8"))
    agents = json.loads((SOURCES / "agents.json").read_text(encoding="utf-8"))
    agent = next(a for a in agents if a["id"] == "ep-2216")

    profile = phoenix["profile"]
    intro = profile.get("intro", "")
    tags: list[str] = []
    tag_match = re.search(r"【角色TAG】(.+)", intro)
    if tag_match:
        tags = [t.strip() for t in tag_match.group(1).split("、") if t.strip()]
    detail = re.sub(r"^【角色TAG】.*\n?", "", intro).strip()
    detail = detail.replace("【角色详情】", "", 1).strip()

    media: list[dict] = []

    def add_media(key: str, url: str | None, variant: str, width: int, height: int) -> str:
        if not url:
            return ""
        media.append(
            {
                "key": key,
                "url": url,
                "variant": variant,
                "width": width,
                "height": height,
            }
        )
        return key

    avatar_key = add_media("agent:phoenix:avatar", phoenix["assets"].get("avatar"), "avatar", 256, 256)
    tachie_key = add_media("agent:phoenix:tachie", phoenix["assets"].get("tachie"), "portrait", 720, 720)
    full_key = add_media("agent:phoenix:full", strategy.get("background"), "full", 1440, 810)
    agent_avatar_key = avatar_key
    film_key = add_media(
        "agent:phoenix:film",
        "https://static.nanoka.cc/assets/zzz/IconRolePiece1641.webp",
        "icon",
        160,
        160,
    )

    cinemas = []
    seen_cinema: dict[str, str] = {}
    for cinema in phoenix["cinemas"]:
        level = cinema["level"]
        url = phoenix["cinemaBackdrops"].get(str(level), {}).get("image")
        key = ""
        if url:
            digest = hashlib.sha1(url.encode("utf-8")).hexdigest()[:12]
            if digest in seen_cinema:
                key = seen_cinema[digest]
            else:
                key = add_media(f"agent:phoenix:cinema:{level}", url, "cinema", 720, 405)
                seen_cinema[digest] = key
        cinemas.append(
            {
                "level": level,
                "name": cinema["name"],
                "effect": cinema["effectText"],
                "story": cinema.get("storyText", ""),
                "image": key,
                "keyLevel": level in (strategy.get("cinemaPriority", {}).get("keyLevels") or []),
            }
        )

    # Skills: non-core get a full growth matrix; core gets per-rank lines.
    skills = []
    for category in phoenix["skills"]:
        key = category["key"]
        moves = []
        for move in category["moves"]:
            table = build_core_table(move) if key == "core" else build_table(move)
            moves.append(
                {
                    "title": move["title"],
                    "text": move.get("text", ""),
                    "table": table,
                }
            )
        skills.append(
            {
                "key": key,
                "name": category["name"],
                "icon": f"/assets/ui/skills/{key}.webp",
                "moves": moves,
            }
        )

    # Guide: flatten the legacy TOML v2 shape into a display-oriented contract.
    weapons = []
    for tier in strategy.get("weapons", []):
        items = []
        for item in tier.get("items", []):
            items.append(
                {
                    "name": item["name"],
                    "stats": item.get("stats", ""),
                    "engineId": item.get("engineId", ""),
                    "refinement": item.get("refinement", 1),
                    "icon": add_media(
                        f"engine:{item.get('engineId', item['name'])}:icon",
                        item.get("icon"),
                        "icon",
                        160,
                        160,
                    ),
                }
            )
        weapons.append({"tier": tier.get("tier", ""), "note": tier.get("note", ""), "items": items})

    builds = []
    for build in strategy.get("driveBuilds", []):
        set4 = build.get("set4") or {}
        set2 = build.get("set2") or {}
        set2_items = []
        for item in set2.get("main", []):
            set2_items.append(
                {
                    "name": item["name"],
                    "label": item.get("label", ""),
                    "icon": add_media(
                        f"set:{item['name']}:icon", item.get("icon"), "icon", 160, 160
                    ),
                }
            )
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
                    "icon": add_media(
                        f"set:{set4.get('name', '')}:4pc",
                        set4.get("icon"),
                        "icon",
                        160,
                        160,
                    ),
                },
                "set2": set2_items,
            }
        )

    teams = []
    for team in strategy.get("teams", []):
        members = []
        for member in team.get("members", []):
            agent_id = member.get("agentId", "")
            member_avatar_key = (
                agent_avatar_key
                if agent_id == "ep-2216"
                else add_media(
                    f"agent:{agent_id or member['name']}:avatar",
                    member.get("avatar"),
                    "avatar",
                    200,
                    200,
                )
            )
            members.append(
                {
                    "agentId": agent_id,
                    "name": member["name"],
                    "role": member.get("role", ""),
                    "note": member.get("note", ""),
                    "avatar": member_avatar_key,
                    "set4": [
                        {"name": s["name"], "icon": add_media(f"set:{s['name']}:icon", s.get("icon"), "icon", 160, 160)}
                        for s in member.get("set4", [])
                    ],
                }
            )
        teams.append({"name": team.get("name", ""), "members": members})

    texts = [
        {"title": t.get("title", ""), "lines": t.get("lines", [])}
        for t in strategy.get("textGuide", [])
    ]

    def graduation(section: dict | None, fallback_title: str) -> dict | None:
        if not section:
            return None
        return {
            "title": section.get("title", fallback_title),
            "statRule": section.get("statRule", ""),
            "totals": section.get("totals", []),
            "note": section.get("note", ""),
            "computedAt": section.get("computedAt", ""),
            "build": section.get("build", {}),
            "spec": section.get("spec", {}),
        }

    guide = {
        "role": "火属性异常主C",
        "tags": tags,
        "oneLiner": "以「灼蚀」放大全队异常伤害，靠「异放」结算爆发。",
        "cinemaPriority": {
            "keyLevels": strategy.get("cinemaPriority", {}).get("keyLevels", []),
            "note": strategy.get("cinemaPriority", {}).get("note", ""),
        },
        "skillPriority": [
            {
                "key": p.get("key", ""),
                "label": p.get("label", ""),
                "level": p.get("level", 0),
                "maxLevel": p.get("maxLevel", 0),
                "next": p.get("next", ""),
            }
            for p in strategy.get("skillPriority", [])
        ],
        "weapons": weapons,
        "builds": builds,
        "teams": teams,
        "texts": texts,
        "graduation": graduation(strategy.get("graduationPanel"), "毕业面板"),
        "graduationAlt": graduation(strategy.get("graduationPanelAlt"), "小毕业面板"),
        "officialGuide": strategy.get("officialGuide", ""),
    }

    # The legacy alt graduation spec lost its `core` field (known bug). Repair it
    # explicitly instead of letting the panel engine silently fall back.
    repairs: list[str] = []
    if guide["graduationAlt"] and "core" not in guide["graduationAlt"]["spec"]:
        guide["graduationAlt"]["spec"]["core"] = ["ac", "atk_base"]
        repairs.append(
            "graduationPanelAlt.spec.core 旧数据缺失，按核心 F（异常掌控 +36 / 基础攻击力 +75）补全"
        )

    # Core passive scaling by rank (official text values).
    core_passive = {
        "name": "涅槃",
        "levels": ["A", "B", "C", "D", "E", "F"],
        "amFlat": [43, 50, 57, 64, 71, 78, 85],
        "critDmg": [12.5, 14.6, 16.7, 18.8, 20.8, 22.9, 25],
        "tickAtkPct": [25, 29.2, 33.3, 37.5, 41.7, 45.8, 50],
        "coreBonus": [
            {"ac": 12, "atkBase": 0},
            {"ac": 12, "atkBase": 25},
            {"ac": 24, "atkBase": 25},
            {"ac": 24, "atkBase": 50},
            {"ac": 36, "atkBase": 50},
            {"ac": 36, "atkBase": 75},
        ],
    }

    out = {
        "id": agent["id"],
        "slug": "phoenix",
        "name": "菲欧妮",
        "fullName": profile["name"],
        "rarity": profile["rank"],
        "element": profile["element"],
        "specialty": profile["trait"],
        "faction": profile.get("factionTitle", ""),
        "tags": tags,
        "intro": detail,
        "profile": {
            "birthday": next((f["value"] for f in profile.get("customFields", []) if f["key"] == "出生日期"), ""),
            "height": next((f["value"] for f in profile.get("customFields", []) if f["key"] == "身高"), ""),
            "cv": "",
        },
        "base": {
            "hp": agent["base"]["hp"],
            "atk": agent["base"]["atk"],
            "def": agent["base"]["def"],
            "impact": agent["base"]["impact"],
            "critRate": agent["base"]["cr"],
            "critDmg": agent["base"]["cd"],
            "anomalyProficiency": agent["base"]["am"],
            "anomalyMastery": agent["base"]["ac"],
            "penRatio": agent["base"]["pr"],
            "energyRegen": agent["base"]["er"],
        },
        "corePassive": core_passive,
        "skills": skills,
        "cinemas": cinemas,
        "assets": {
            "avatar": avatar_key,
            "tachie": tachie_key,
            "full": full_key,
            "film": film_key,
        },
        "guide": guide,
        "sources": [
            {
                "label": "官方 WIKI · 代理人",
                "url": "https://baike.mihoyo.com/zzz/wiki/content/2216/detail",
            },
            {
                "label": "官方玩法合集",
                "url": "https://baike.mihoyo.com/zzz/wiki/channel/map/66/68",
            },
        ],
        "repairs": repairs,
        "updatedAt": "2026-11-04",
    }

    OUT_AGENTS.mkdir(parents=True, exist_ok=True)
    (OUT_AGENTS / "phoenix.json").write_text(
        json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )

    index = [
        {
            "slug": "phoenix",
            "name": out["name"],
            "fullName": out["fullName"],
            "rarity": out["rarity"],
            "element": out["element"],
            "specialty": out["specialty"],
            "faction": out["faction"],
            "avatar": avatar_key,
            "tags": tags,
        }
    ]
    (OUT_AGENTS / "index.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8"
    )

    unique: dict[str, dict] = {}
    for entry in media:
        unique.setdefault(entry["key"], entry)
    load_media(list(unique.values()))

    print(f"agents/phoenix.json: {len(json.dumps(out))} chars")
    print(f"media keys: {len(unique)}")
    print(f"skills: {len(skills)} categories, cinemas: {len(cinemas)}")


if __name__ == "__main__":
    main()
