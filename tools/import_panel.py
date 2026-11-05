"""Build src/data/panel.json from rules + source subsets.

Inputs:
  - data/rules/panel.toml
  - data/sources/engines.json
  - data/sources/drive-sets.json
  - data/guides/*.toml (which engines/sets the shipped dossiers may select)

Outputs:
  - src/data/panel.json

The engine list is the union of every engine referenced by a shipped guide, so
the calculator can offer exactly the recommended options per agent.

Run: python tools/import_panel.py
"""

from __future__ import annotations

import json
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RULES = ROOT / "data" / "rules" / "panel.toml"
SOURCES = ROOT / "data" / "sources"
GUIDES = ROOT / "data" / "guides"
OUT = ROOT / "src" / "data" / "panel.json"

# Catalog substat targets -> canonical stat ids.
TARGET_TO_STAT = {
    "atk_pct": "atk",
    "hp_pct": "hp",
    "def_pct": "def",
    "ac_pct": "anomalyMastery",
    "am": "anomalyProficiency",
    "pen_val": "penValue",
    "cr": "critRate",
    "cd": "critDmg",
    "dmg": "dmgBonus",
    "pr": "penRatio",
    "er_pct": "energyRegen",
    "impact_pct": "impact",
    "atk_base": "atk",
}


def referenced_engine_ids() -> set[str]:
    ids: set[str] = set()
    for path in sorted(GUIDES.glob("*.toml")):
        guide = tomllib.loads(path.read_text(encoding="utf-8"))
        for tier in guide.get("weapons", []):
            for item in tier.get("items", []):
                if item.get("engineId"):
                    ids.add(item["engineId"])
        for key in ("graduationPanel", "graduationPanelAlt"):
            spec = (guide.get(key) or {}).get("spec") or {}
            if spec.get("weaponId"):
                ids.add(spec["weaponId"])
    return ids


def main() -> None:
    rules = tomllib.loads(RULES.read_text(encoding="utf-8"))
    wanted = referenced_engine_ids()
    if not wanted:
        raise SystemExit("no engine referenced by data/guides/*.toml")
    engines_src = [
        item
        for item in json.loads((SOURCES / "engines.json").read_text(encoding="utf-8"))
        if item["id"] in wanted
    ]
    found = {item["id"] for item in engines_src}
    missing = wanted - found
    if missing:
        raise SystemExit(f"guide references engines missing from data/sources/engines.json: {sorted(missing)}")
    sets_src = json.loads((SOURCES / "drive-sets.json").read_text(encoding="utf-8"))

    effects = {item["id"]: item for item in rules.get("setEffects", [])}

    engines = []
    for engine in engines_src:
        sub = engine.get("substat") or {}
        stat = TARGET_TO_STAT.get(sub.get("to", ""))
        engines.append(
            {
                "id": engine["id"],
                "name": engine["name"],
                "rank": engine["rank"],
                "baseAtk": engine["base"]["value"] if engine["base"]["kind"] == "atk" else 0,
                "baseDef": engine["base"]["value"] if engine["base"]["kind"] == "def" else 0,
                "subStat": (
                    {
                        "stat": stat,
                        "value": sub.get("value", 0),
                        "kind": sub.get("kind", "pct"),
                        "label": sub.get("label", ""),
                    }
                    if stat
                    else None
                ),
                "icon": f"engine:{engine['id']}:icon",
            }
        )
    engines.sort(key=lambda item: (item["rank"] != "S", item["name"]))

    sets = []
    unknown_effects = set()
    for item in sets_src:
        effect_id = item.get("effect2")
        effect = effects.get(effect_id) if effect_id else None
        if effect_id and not effect:
            unknown_effects.add(effect_id)
        sets.append(
            {
                "id": item["id"],
                "name": item["name"],
                "effect2": (
                    {
                        "id": effect_id,
                        "stat": effect["stat"],
                        "value": effect["value"],
                        "kind": effect["kind"],
                        "label": effect["label"],
                    }
                    if effect
                    else None
                ),
                "effect2Text": item.get("setEffect2", ""),
                "icon": f"set:{item['name']}:icon",
            }
        )

    payload = {
        "discFixed": rules["discFixed"],
        "substats": rules["substats"],
        "mainStats": rules["mainStats"],
        "setEffects": rules["setEffects"],
        "engines": engines,
        "sets": sets,
        "meta": {
            "generatedBy": "tools/import_panel.py",
            "engineCount": len(engines),
            "setCount": len(sets),
            "unknownSetEffects": sorted(unknown_effects),
        },
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"panel.json: {len(json.dumps(payload))} chars | engines {len(engines)} | sets {len(sets)}")
    if unknown_effects:
        print("unknown set effects:", ", ".join(sorted(unknown_effects)))


if __name__ == "__main__":
    main()
