"""Build codex data for engines, drive discs and bangboo.

Inputs:
  - data/sources/engines.json + engine-icons.json
  - data/sources/drive-sets.json
  - data/sources/bangboo.json

Outputs:
  - src/data/codex/engines.json + engines.index.json
  - src/data/codex/sets.json + sets.index.json
  - src/data/codex/bangboo.json + bangboo.index.json
  - src/data/media.json (merged; consumed by sync_assets.py)

Run: python tools/import_codex.py
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "data" / "sources"
OUT = ROOT / "src" / "data" / "codex"


def load(name: str):
    return json.loads((SOURCES / name).read_text(encoding="utf-8"))


def norm_substat(sub: dict | None) -> dict | None:
    if not sub:
        return None
    return {
        "label": sub.get("label", ""),
        "value": sub.get("value", 0),
        "kind": sub.get("kind", "pct"),
        "to": sub.get("to", ""),
    }


def main() -> None:
    engines = load("engines.json")
    engine_icons = load("engine-icons.json")
    sets = load("drive-sets.json")
    bangboo = load("bangboo.json")
    wiki = load("bangboo-wiki.json") if (SOURCES / "bangboo-wiki.json").exists() else {"byName": {}}
    wiki_by_name = wiki.get("byName", {})

    engine_items = []
    for item in engines:
        effect = item.get("effect") or {}
        base = item.get("base") or {}
        engine_items.append(
            {
                "id": item["id"],
                "name": item["name"],
                "rank": item.get("rank", ""),
                "trait": item.get("trait", ""),
                "baseAtk": base.get("value", 0) if base.get("kind") == "atk" else 0,
                "baseDef": base.get("value", 0) if base.get("kind") == "def" else 0,
                "subStat": norm_substat(item.get("substat")),
                "effect": {
                    "name": effect.get("name", ""),
                    "text": effect.get("text", ""),
                    "refinements": effect.get("refinements", []),
                },
                "acquisition": item.get("acquisition", ""),
                "source": item.get("source", ""),
                "iconUrl": engine_icons.get(item["id"], ""),
            }
        )

    set_items = []
    for item in sets:
        set_items.append(
            {
                "id": item["id"],
                "name": item["name"],
                "effect2": item.get("setEffect2", ""),
                "effect4": item.get("setEffect4", ""),
                "effect2Id": item.get("effect2"),
                "source": item.get("source", ""),
                "iconUrl": item.get("image", ""),
            }
        )

    bangboo_items = []
    for item in bangboo:
        extra = wiki_by_name.get(item["name"], {})
        bangboo_items.append(
            {
                "id": item["id"],
                "slug": item["slug"],
                "name": item["name"],
                "en": item.get("en", ""),
                "codename": item.get("codename", ""),
                "rank": item.get("rank", ""),
                "iconUrl": item.get("icon", ""),
                "description": item.get("description", ""),
                "descriptionZh": extra.get("description", ""),
                "wikiId": extra.get("wikiId"),
                "skills": extra.get("skills", []),
                "stats": item.get("stats", {}),
            }
        )

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "engines.json").write_text(
        json.dumps(engine_items, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    (OUT / "engines.index.json").write_text(
        json.dumps(
            [
                {
                    "id": item["id"],
                    "name": item["name"],
                    "rank": item["rank"],
                    "trait": item["trait"],
                    "baseAtk": item["baseAtk"],
                    "baseDef": item["baseDef"],
                    "subStat": item["subStat"],
                }
                for item in engine_items
            ],
            ensure_ascii=False,
            separators=(",", ":"),
        ),
        encoding="utf-8",
    )
    (OUT / "sets.json").write_text(
        json.dumps(set_items, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    (OUT / "sets.index.json").write_text(
        json.dumps(
            [
                {
                    "id": item["id"],
                    "name": item["name"],
                    "effect2": item["effect2"],
                    "effect4": item["effect4"],
                    "effect2Id": item["effect2Id"],
                }
                for item in set_items
            ],
            ensure_ascii=False,
            separators=(",", ":"),
        ),
        encoding="utf-8",
    )
    (OUT / "bangboo.json").write_text(
        json.dumps(bangboo_items, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    (OUT / "bangboo.index.json").write_text(
        json.dumps(
            [
                {
                    "id": item["id"],
                    "slug": item["slug"],
                    "name": item["name"],
                    "en": item["en"],
                    "rank": item["rank"],
                    "description": item["description"],
                    "descriptionZh": item["descriptionZh"],
                }
                for item in bangboo_items
            ],
            ensure_ascii=False,
            separators=(",", ":"),
        ),
        encoding="utf-8",
    )

    media_path = ROOT / "src" / "data" / "media.json"
    media = json.loads(media_path.read_text(encoding="utf-8")) if media_path.exists() else []
    by_key = {entry["key"]: entry for entry in media}

    def add(key: str, url: str, variant: str = "icon", width: int = 160, height: int = 160) -> None:
        if not url or key in by_key:
            return
        by_key[key] = {"key": key, "url": url, "variant": variant, "width": width, "height": height}

    for item in engine_items:
        add(f"engine:{item['id']}:icon", item.get("iconUrl", ""))
    for item in set_items:
        add(f"set:{item['name']}:icon", item.get("iconUrl", ""))
    for item in bangboo_items:
        add(f"bangboo:{item['slug']}:icon", item.get("iconUrl", ""), width=200, height=200)

    media_path.write_text(
        json.dumps(list(by_key.values()), ensure_ascii=False, indent=1), encoding="utf-8"
    )

    print(
        f"engines {len(engine_items)} | sets {len(set_items)} | bangboo {len(bangboo_items)} | "
        f"media keys {len(by_key)}"
    )


if __name__ == "__main__":
    main()
