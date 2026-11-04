"""Download and localize media entries declared in src/data/media.json.

- Unique source URL -> one cached original in .cache/assets/originals/
- Each media key -> one resized WebP in public/assets/media/
- Writes src/data/media-manifest.json and public/assets/manifest.json

Run: python tools/sync_assets.py
"""

from __future__ import annotations

import hashlib
import json
import sys
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
MEDIA = ROOT / "src" / "data" / "media.json"
CACHE = ROOT / ".cache" / "assets" / "originals"
PUBLIC = ROOT / "public" / "assets"
OUT_DIR = PUBLIC / "media"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"
    ),
    "Referer": "https://baike.mihoyo.com/",
}

# variant -> max width, quality
VARIANTS = {
    "avatar": (256, 84),
    "portrait": (720, 82),
    "full": (1440, 80),
    "cinema": (1440, 80),
    "icon": (160, 84),
}


def download(url: str, target: Path) -> None:
    if target.exists() and target.stat().st_size > 0:
        return
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read()
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)


def dominant_color(img: Image.Image) -> str:
    small = img.convert("RGB").resize((1, 1), Image.Resampling.BOX)
    r, g, b = small.getpixel((0, 0))
    return f"#{r:02x}{g:02x}{b:02x}"


def process(entry: dict, url_hash: str, out_dir: Path) -> dict | None:
    variant = entry["variant"]
    max_w, quality = VARIANTS.get(variant, (720, 82))
    original = CACHE / f"{url_hash}.bin"
    download(entry["url"], original)
    try:
        img = Image.open(original)
    except Exception as exc:  # noqa: BLE001
        print(f"  ! cannot open {entry['url']}: {exc}", file=sys.stderr)
        return None
    img.load()

    has_alpha = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)
    img = img.convert("RGBA" if has_alpha else "RGB")

    width, height = img.size
    if variant == "avatar":
        side = min(width, height)
        left = (width - side) // 2
        top = (height - side) // 2
        img = img.crop((left, top, left + side, top + side))
        width = height = side
    if width > max_w:
        ratio = max_w / width
        img = img.resize((max_w, max(1, round(height * ratio))), Image.Resampling.LANCZOS)

    color = dominant_color(img)
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{url_hash[:10]}-{variant}.webp"
    img.save(out_path, "WEBP", quality=quality, method=6)
    return {
        "src": f"/assets/media/{out_path.name}",
        "width": img.size[0],
        "height": img.size[1],
        "color": color,
    }


def main() -> None:
    entries = json.loads(MEDIA.read_text(encoding="utf-8"))
    manifest_path = ROOT / "src" / "data" / "media-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {}
    # Drop keys that are no longer declared, otherwise renamed media (e.g. the
    # per-level cinema backdrops) keep stale manifest entries and inflate checks.
    declared = {entry["key"] for entry in entries}
    manifest = {key: item for key, item in manifest.items() if key in declared}

    failed: list[str] = []
    total = 0
    for entry in entries:
        key = entry["key"]
        url_hash = hashlib.sha1(entry["url"].encode("utf-8")).hexdigest()
        try:
            result = process(entry, url_hash, OUT_DIR)
        except Exception as exc:  # noqa: BLE001
            print(f"  ! download failed {key}: {exc}", file=sys.stderr)
            result = None
        if result is None:
            failed.append(key)
            continue
        result["source"] = entry["url"]
        result["variant"] = entry["variant"]
        manifest[key] = result
        total += (ROOT / "public" / result["src"].lstrip("/")).stat().st_size
        print(f"  ok {key} -> {result['src']} ({result['width']}x{result['height']})")

    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    PUBLIC.mkdir(parents=True, exist_ok=True)
    (PUBLIC / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8"
    )

    print(f"\nmedia: {len(manifest)} keys, {total / 1024:.1f} KiB")
    if failed:
        print(f"failed: {len(failed)} -> {', '.join(failed)}", file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
