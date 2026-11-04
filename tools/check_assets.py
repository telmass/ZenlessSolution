"""Offline asset check: manifest <-> files <-> data references, budget and orphans.

Run: python tools/check_assets.py
Exit code 1 on any violation.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MEDIA = ROOT / "src" / "data" / "media.json"
MANIFEST = ROOT / "src" / "data" / "media-manifest.json"
AGENT = ROOT / "src" / "data" / "agents" / "phoenix.json"
CODEX = ROOT / "src" / "data" / "codex"
PUBLIC = ROOT / "public"
ASSET_DIR = PUBLIC / "assets" / "media"

TOTAL_BUDGET = 45 * 1024 * 1024
PER_FILE_BUDGET = 1 * 1024 * 1024

MEDIA_KEY_RE = re.compile(r"^(agent|engine|set|bangboo):[^:]+:")


def collect_keys(node, found: set[str]) -> None:
    if isinstance(node, dict):
        for value in node.values():
            collect_keys(value, found)
    elif isinstance(node, list):
        for value in node:
            collect_keys(value, found)
    elif isinstance(node, str) and MEDIA_KEY_RE.match(node) and "://" not in node:
        found.add(node)


def main() -> None:
    errors: list[str] = []
    if not MANIFEST.exists():
        print("missing src/data/media-manifest.json; run pnpm assets:sync", file=sys.stderr)
        raise SystemExit(1)
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    entries = json.loads(MEDIA.read_text(encoding="utf-8"))
    agent = json.loads(AGENT.read_text(encoding="utf-8"))

    declared = {entry["key"] for entry in entries}
    missing = declared - set(manifest)
    if missing:
        errors.append(f"manifest missing keys: {', '.join(sorted(missing))}")

    referenced: set[str] = set()
    collect_keys(agent, referenced)
    unknown = referenced - set(manifest)
    if unknown:
        errors.append(f"data references unknown media keys: {', '.join(sorted(unknown))}")

    engines = json.loads((CODEX / "engines.json").read_text(encoding="utf-8"))
    sets = json.loads((CODEX / "sets.json").read_text(encoding="utf-8"))
    bangboo = json.loads((CODEX / "bangboo.json").read_text(encoding="utf-8"))
    expected = {f"engine:{item['id']}:icon" for item in engines}
    expected |= {f"set:{item['name']}:icon" for item in sets}
    expected |= {f"bangboo:{item['slug']}:icon" for item in bangboo if item.get("iconUrl")}
    missing_icons = expected - set(manifest)
    if missing_icons:
        errors.append(f"codex icons missing from manifest: {', '.join(sorted(missing_icons)[:8])}")

    if len(engines) != 101:
        errors.append(f"engine codex = {len(engines)}, expected 101")
    if len(sets) != 30:
        errors.append(f"drive set codex = {len(sets)}, expected 30")
    if len(bangboo) != 42:
        errors.append(f"bangboo codex = {len(bangboo)}, expected 42")

    total = 0
    used_files: set[str] = set()
    for key, item in manifest.items():
        path = PUBLIC / item["src"].lstrip("/")
        if not path.exists():
            errors.append(f"file missing for {key}: {item['src']}")
            continue
        size = path.stat().st_size
        total += size
        used_files.add(path.name)
        if size > PER_FILE_BUDGET:
            errors.append(f"file over 1 MiB: {item['src']} ({size / 1024:.0f} KiB)")

    if total > TOTAL_BUDGET:
        errors.append(f"total assets over budget: {total / 1024 / 1024:.1f} MiB > 45 MiB")

    orphans = [p.name for p in ASSET_DIR.glob("*.webp") if p.name not in used_files]
    if orphans:
        errors.append(f"orphan files ({len(orphans)}): {', '.join(sorted(orphans)[:5])}")

    print(f"manifest keys: {len(manifest)}")
    print(f"referenced by data: {len(referenced)}")
    print(f"codex icons expected: {len(expected)}")
    print(f"total size: {total / 1024 / 1024:.2f} MiB")
    if errors:
        print("\nFAILED:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        raise SystemExit(1)
    print("assets OK")


if __name__ == "__main__":
    main()
