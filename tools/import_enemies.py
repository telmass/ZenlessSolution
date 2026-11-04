"""Generate enemy presets consumed by the damage engine.

Run: python tools/import_enemies.py
"""

from __future__ import annotations

import json
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "data" / "rules" / "enemies.toml"
OUT = ROOT / "src" / "data" / "enemies.json"


def main() -> None:
    rules = tomllib.loads(SOURCE.read_text(encoding="utf-8"))
    enemies = rules.get("enemy", [])
    if not enemies:
        raise SystemExit("enemies.toml has no [[enemy]]")
    for item in enemies:
        for key in ("id", "label", "level", "defense", "resistance", "stunned"):
            if key not in item:
                raise SystemExit(f"enemy {item.get('id', '?')} missing {key}")
    OUT.write_text(json.dumps(enemies, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"enemies: {len(enemies)}")


if __name__ == "__main__":
    main()
