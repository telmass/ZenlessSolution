"""Contract checks for every generated agent dossier.

Run: python tools/check_data.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AGENTS = ROOT / "src" / "data" / "agents"
INDEX = ROOT / "src" / "data" / "agents" / "index.json"
MANIFEST = ROOT / "src" / "data" / "media-manifest.json"

SKILL_KEYS = ["basic", "dodge", "assist", "special", "chain", "core"]
MEDIA_KEY_RE = re.compile(r"^(agent|engine|set|bangboo):[^:]+:")
BASE_FIELDS = (
    "hp",
    "atk",
    "def",
    "impact",
    "critRate",
    "critDmg",
    "anomalyProficiency",
    "anomalyMastery",
    "penRatio",
    "energyRegen",
)


def collect_media_keys(node, found: set[str]) -> None:
    if isinstance(node, dict):
        for value in node.values():
            collect_media_keys(value, found)
    elif isinstance(node, list):
        for value in node:
            collect_media_keys(value, found)
    elif isinstance(node, str) and MEDIA_KEY_RE.match(node):
        found.add(node)


def check_agent(slug: str, agent: dict, manifest: set[str], errors: list[str]) -> int:
    tag = f"[{slug}]"
    if agent["slug"] != slug:
        errors.append(f"{tag} slug mismatch: {agent['slug']}")
    if not agent["id"].startswith("ep-"):
        errors.append(f"{tag} unexpected agent id {agent['id']}")
    if [skill["key"] for skill in agent["skills"]] != SKILL_KEYS:
        errors.append(f"{tag} skill categories mismatch")
    for skill in agent["skills"]:
        if not skill["moves"]:
            errors.append(f"{tag} {skill['key']} has no moves")
        for move in skill["moves"]:
            table = move.get("table")
            if not table:
                continue
            if skill["key"] == "core":
                if [row["level"] for row in table["levels"]] != list("ABCDEF"):
                    errors.append(f"{tag} core levels invalid for {move['title']}")
                continue
            if len(table["levels"]) != 16:
                errors.append(f"{tag} {move['title']} has {len(table['levels'])} levels")
            for group in table["groups"]:
                for row in group["rows"]:
                    if len(row["values"]) != 16:
                        errors.append(f"{tag} {move['title']}/{row['label']} width")
                        break

    cinemas = agent["cinemas"]
    if [c["level"] for c in cinemas] != [1, 2, 3, 4, 5, 6]:
        errors.append(f"{tag} cinema levels mismatch")
    key_levels = {c["level"] for c in cinemas if c["keyLevel"]}
    declared = set(agent["guide"]["cinemaPriority"]["keyLevels"])
    if key_levels != declared:
        errors.append(f"{tag} cinema key levels disagree with guide: {sorted(key_levels)} vs {sorted(declared)}")

    for field in BASE_FIELDS:
        if not isinstance(agent["base"].get(field), (int, float)):
            errors.append(f"{tag} base.{field} missing")

    passive = agent["corePassive"]
    if len(passive.get("coreBonus", [])) != 6:
        errors.append(f"{tag} coreBonus must have six ranks")
    if not passive.get("effects"):
        errors.append(f"{tag} core passive effects missing")
    profile = agent.get("substatProfile") or {}
    if not profile.get("effective"):
        errors.append(f"{tag} substat profile missing effective stats")

    guide = agent["guide"]
    if not guide["builds"]:
        errors.append(f"{tag} no drive disc build")
    if not guide["teams"]:
        errors.append(f"{tag} no team")
    if not any(text["title"] == "影画要点" for text in guide["texts"]):
        errors.append(f"{tag} missing 影画要点 text")
    if not guide["skillPriority"]:
        errors.append(f"{tag} no skill priority")
    if not guide["weapons"]:
        errors.append(f"{tag} no weapon tiers")

    for key, graduation in (("graduation", guide.get("graduation")), ("graduationAlt", guide.get("graduationAlt"))):
        if not graduation:
            errors.append(f"{tag} missing {key}")
            continue
        spec = graduation["spec"]
        budget = spec.get("budget")
        total = sum(item["count"] for item in spec.get("subStats", []))
        if total != budget:
            errors.append(f"{tag} {key} substats {total} != budget {budget}")
        if "core" not in spec:
            errors.append(f"{tag} {key}.spec missing core")
        panel_spec = graduation.get("panel") or {}
        if not panel_spec:
            errors.append(f"{tag} {key} has no panel mapping")
            continue
        if sum(panel_spec.get("substats", {}).values()) != panel_spec.get("budget"):
            errors.append(f"{tag} {key} panel substats != budget")
        if panel_spec.get("coreLevel") != "F":
            errors.append(f"{tag} {key} panel core level must be F")

    referenced: set[str] = set()
    collect_media_keys(agent, referenced)
    missing = referenced - manifest
    if missing:
        errors.append(f"{tag} media keys missing from manifest: {sorted(missing)}")

    payload = json.dumps(agent, ensure_ascii=False)
    if "TODO" in payload:
        errors.append(f"{tag} generated data contains TODO")
    return len(referenced)


def main() -> None:
    errors: list[str] = []
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    manifest = set(json.loads(MANIFEST.read_text(encoding="utf-8")))

    if len(index) != 61:
        errors.append(f"agent index has {len(index)} entries, expected 61")
    slugs = [entry.get("slug") for entry in index]
    if len(set(slugs)) != len(slugs):
        errors.append("agent index contains duplicate slugs")
    if slugs[0] != "phoenix":
        errors.append("phoenix should be the first agent-index entry")

    required = ("id", "slug", "en", "name", "fullName", "rarity", "element", "specialty", "faction")
    for entry in index:
        missing_fields = [field for field in required if not entry.get(field)]
        if missing_fields:
            errors.append(f"index entry {entry.get('slug')} missing: {missing_fields}")
        if not isinstance(entry.get("available"), bool):
            errors.append(f"index entry {entry.get('slug')} non-boolean available")

    open_entries = [entry for entry in index if entry.get("available")]
    open_slugs = [entry["slug"] for entry in open_entries]
    if not open_entries:
        errors.append("no agent is open")
    if any(entry["specialty"] != "异常" for entry in open_entries):
        errors.append("every open agent should be an Anomaly agent")

    files = {path.stem for path in AGENTS.glob("*.json") if path.name != "index.json"}
    if files != set(open_slugs):
        errors.append(f"agent files {sorted(files)} != open slugs {sorted(open_slugs)}")

    total_refs = 0
    for slug in open_slugs:
        agent = json.loads((AGENTS / f"{slug}.json").read_text(encoding="utf-8"))
        total_refs += check_agent(slug, agent, manifest, errors)

    panel = json.loads((ROOT / "src" / "data" / "panel.json").read_text(encoding="utf-8"))
    if len(panel["engines"]) < 4:
        errors.append(f"panel engines = {len(panel['engines'])}, expected the shipped guide engines")
    if len(panel["sets"]) != 30:
        errors.append(f"panel sets = {len(panel['sets'])}, expected 30")
    if len(panel["substats"]) != 10:
        errors.append(f"panel substats = {len(panel['substats'])}, expected 10")
    if {item["slot"] for item in panel["mainStats"]} != {4, 5, 6}:
        errors.append("panel mainStats slots mismatch")
    if panel["discFixed"] != {"hp": 2200, "atk": 316, "def": 184}:
        errors.append(f"panel discFixed mismatch: {panel['discFixed']}")

    panel_engine_ids = {item["id"] for item in panel["engines"]}
    for slug in open_slugs:
        agent = json.loads((AGENTS / f"{slug}.json").read_text(encoding="utf-8"))
        for key in ("graduation", "graduationAlt"):
            graduation = agent["guide"].get(key)
            if not graduation or not graduation.get("panel"):
                continue
            engine_id = graduation["panel"]["engineId"]
            if engine_id not in panel_engine_ids:
                errors.append(f"[{slug}] {key} engine {engine_id} missing from panel.json")

    codex_dir = ROOT / "src" / "data" / "codex"
    for filename, expected_count in (
        ("engines.json", 101),
        ("sets.json", 30),
        ("bangboo.json", 42),
    ):
        rows = json.loads((codex_dir / filename).read_text(encoding="utf-8"))
        if len(rows) != expected_count:
            errors.append(f"{filename} = {len(rows)}, expected {expected_count}")

    enemies = json.loads((ROOT / "src" / "data" / "enemies.json").read_text(encoding="utf-8"))
    if len(enemies) != 4:
        errors.append(f"enemies = {len(enemies)}, expected 4")

    print(
        f"agents: {len(open_slugs)} open / {len(index)} roster | media refs: {total_refs} | "
        f"panel engines: {len(panel['engines'])}"
    )
    if errors:
        print("FAILED:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        raise SystemExit(1)
    print("data OK")


if __name__ == "__main__":
    main()
