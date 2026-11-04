"""Contract checks for the generated Phoenix data.

Run: python tools/check_data.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AGENT = ROOT / "src" / "data" / "agents" / "phoenix.json"
INDEX = ROOT / "src" / "data" / "agents" / "index.json"
MANIFEST = ROOT / "src" / "data" / "media-manifest.json"

SKILL_KEYS = ["basic", "dodge", "assist", "special", "chain", "core"]
MEDIA_KEY_RE = re.compile(r"^(agent|engine|set|bangboo):[^:]+:")


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def collect_media_keys(node, found: set[str]) -> None:
    if isinstance(node, dict):
        for value in node.values():
            collect_media_keys(value, found)
    elif isinstance(node, list):
        for value in node:
            collect_media_keys(value, found)
    elif isinstance(node, str) and MEDIA_KEY_RE.match(node):
        found.add(node)


def main() -> None:
    errors: list[str] = []
    agent = json.loads(AGENT.read_text(encoding="utf-8"))
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))

    if agent["id"] != "ep-2216":
        fail(errors, f"unexpected agent id: {agent['id']}")
    if agent["slug"] != "phoenix":
        fail(errors, f"unexpected slug: {agent['slug']}")
    if agent["rarity"] != "S" or agent["element"] != "火" or agent["specialty"] != "异常":
        fail(errors, "rarity/element/specialty mismatch")

    base = agent["base"]
    expected_base = {
        "hp": 7673,
        "atk": 797,
        "def": 612,
        "impact": 86,
        "critRate": 5,
        "critDmg": 50,
        "anomalyProficiency": 118,
        "anomalyMastery": 116,
        "energyRegen": 1.2,
    }
    for key, expected in expected_base.items():
        if base.get(key) != expected:
            fail(errors, f"base.{key} = {base.get(key)}, expected {expected}")

    skills = agent["skills"]
    if [skill["key"] for skill in skills] != SKILL_KEYS:
        fail(errors, f"skill categories mismatch: {[s['key'] for s in skills]}")

    move_count = 0
    for skill in skills:
        if not skill["moves"]:
            fail(errors, f"{skill['key']} has no moves")
        for move in skill["moves"]:
            move_count += 1
            table = move.get("table")
            if not table:
                continue
            if skill["key"] == "core":
                if [row["level"] for row in table["levels"]] != ["A", "B", "C", "D", "E", "F"]:
                    fail(errors, f"core levels invalid for {move['title']}")
                continue
            if len(table["levels"]) != 16:
                fail(errors, f"{move['title']} has {len(table['levels'])} levels")
            for group in table["groups"]:
                for row in group["rows"]:
                    if len(row["values"]) != 16:
                        fail(errors, f"{move['title']}/{row['label']} has {len(row['values'])} values")
                        break

    if move_count != 18:
        fail(errors, f"expected 18 moves, got {move_count}")

    cinemas = agent["cinemas"]
    if [c["level"] for c in cinemas] != [1, 2, 3, 4, 5, 6]:
        fail(errors, "cinema levels mismatch")
    if {c["level"] for c in cinemas if c["keyLevel"]} != {1, 6}:
        fail(errors, "key cinemas should be 1 and 6")

    guide = agent["guide"]
    if len(guide["weapons"]) != 4:
        fail(errors, f"expected 4 weapon tiers, got {len(guide['weapons'])}")
    if not guide["builds"]:
        fail(errors, "no drive disc build")
    if len(guide["teams"]) != 2:
        fail(errors, f"expected 2 teams, got {len(guide['teams'])}")
    if len(guide["texts"]) != 3:
        fail(errors, f"expected 3 text sections, got {len(guide['texts'])}")

    for key, budget in (("graduation", 54), ("graduationAlt", 30)):
        graduation = guide.get(key)
        if not graduation:
            fail(errors, f"missing {key}")
            continue
        if graduation["spec"].get("budget") != budget:
            fail(errors, f"{key} budget mismatch")
        total = sum(item["count"] for item in graduation["spec"].get("subStats", []))
        if total != budget:
            fail(errors, f"{key} subStats total {total} != {budget}")
        if "core" not in graduation["spec"]:
            fail(errors, f"{key}.spec missing core (legacy bug)")

    referenced: set[str] = set()
    collect_media_keys(agent, referenced)
    missing = referenced - set(manifest)
    if missing:
        fail(errors, f"media keys missing from manifest: {sorted(missing)}")

    payload = json.dumps(agent, ensure_ascii=False)
    if "TODO" in payload or "TODO" in json.dumps(guide, ensure_ascii=False):
        fail(errors, "generated data contains TODO")

    print(
        f"agent: {agent['name']} ({agent['id']}) | skills: {len(skills)} | moves: {move_count} | "
        f"cinemas: {len(cinemas)} | teams: {len(guide['teams'])} | media refs: {len(referenced)}"
    )
    if errors:
        print("FAILED:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        raise SystemExit(1)
    print("data OK")


if __name__ == "__main__":
    main()
