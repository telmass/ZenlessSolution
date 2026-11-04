"""Refresh bangboo skills + Chinese profiles from the official HoYoWiki.

The wiki exposes a single 邦布 index page (545) whose table carries 25 launch
bangboo with skill text; later bangboo have their own entry pages. We scan the
entry id space for the names already present in data/sources/bangboo.json,
then read `role_talent` (skills) and the final `double_col_table` (profile).

Output: data/sources/bangboo-wiki.json
Run manually: python tools/refresh_bangboo_wiki.py
"""

from __future__ import annotations

import json
import re
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BANGBOO = ROOT / "data" / "sources" / "bangboo.json"
OUT = ROOT / "data" / "sources" / "bangboo-wiki.json"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Referer": "https://baike.mihoyo.com/",
    "x-rpc-wiki_app": "zzz",
    "x-rpc-language": "zh-cn",
}
API = "https://act-api-takumi.mihoyo.com/hoyowiki/zzz/wapi/entry_page_v2?entry_page_id={}"
# The 545 index table spells 飚速布 as 飙速布; its own entry (287) uses 飚速布.
INDEX_ALIASES = {"飚速布": "飙速布"}


def fetch(page_id: int) -> dict:
    req = urllib.request.Request(API.format(page_id), headers=HEADERS)
    return json.loads(urllib.request.urlopen(req, timeout=20).read().decode("utf-8"))


def html_text(html: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", html)
    text = re.sub(r"</p>", "\n", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = unescape(text).replace("\xa0", " ")
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.splitlines()]
    return "\n".join(line for line in lines if line)


def parse_index_skills() -> dict[str, str]:
    page = fetch(545)["data"]["page"]
    table = json.loads(page["modules"][0]["components"][0]["data"])
    result = {}
    for sheet in table["tables"]:
        for row in sheet["row"]:
            name_html, skill_html = row
            names = re.findall(r"<p[^>]*>([^<]+)</p>", name_html)
            if names:
                result[unescape(names[-1]).strip()] = html_text(skill_html)
    return result


def extract_skills(page: dict) -> list[dict]:
    skills = []
    for module in page.get("modules", []):
        for comp in module.get("components", []):
            if comp.get("component_id") != "role_talent":
                continue
            raw = comp.get("data")
            data = json.loads(raw) if isinstance(raw, str) else raw
            for tab in data.get("list", []):
                tab_name = tab.get("tab_name", "")
                for child in tab.get("children", []):
                    desc = html_text(child.get("desc", ""))
                    if not desc:
                        continue
                    lines = desc.splitlines()
                    if lines and re.fullmatch(r"\[(主动技|额外能力|邦布连携技)\]", lines[0].strip()):
                        desc = "\n".join(lines[1:]).strip()
                    if not desc:
                        continue
                    detail = ""
                    growth = child.get("growth") or []
                    if growth:
                        levels = growth[0].get("children") or []
                        if levels:
                            row = (levels[0].get("row") or [[""]])[0]
                            detail = "\n".join(html_text(cell) for cell in row if cell)
                    skills.append(
                        {
                            "tab": tab_name,
                            "title": html_text(child.get("title", "")),
                            "desc": desc,
                            "detail": detail,
                            "levels": len(growth),
                        }
                    )
    return skills


def extract_profile(page: dict) -> str:
    tables = []
    for module in page.get("modules", []):
        for comp in module.get("components", []):
            if comp.get("component_id") != "double_col_table":
                continue
            raw = comp.get("data")
            data = json.loads(raw) if isinstance(raw, str) else raw
            for table in data.get("tables", []):
                header = table.get("header") or []
                if header and "推荐理由" in header:
                    continue
                for row in table.get("row", []):
                    cells = [html_text(cell) for cell in row]
                    text = "\n".join(cell for cell in cells if cell and not cell.startswith("<"))
                    if text and len(text) < 400:
                        tables.append(text)
    return tables[-1] if tables else ""


def main() -> None:
    bangboo = json.loads(BANGBOO.read_text(encoding="utf-8"))
    target_names = {item["name"] for item in bangboo}
    index_skills = parse_index_skills()

    hits: dict[str, int] = {}
    with ThreadPoolExecutor(max_workers=16) as pool:
        futures = [pool.submit(fetch, i) for i in range(1, 2801)]
        for done, future in enumerate(as_completed(futures), 1):
            try:
                page = (future.result().get("data") or {}).get("page") or {}
            except Exception:
                continue
            name = page.get("name")
            if name in target_names and name not in hits:
                hits[name] = int(page["id"])
                print(f"found {name} -> {page['id']}", flush=True)
            if done % 500 == 0:
                print(f"scanned {done}, hits {len(hits)}", flush=True)

    by_name: dict[str, dict] = {}
    for name, wiki_id in sorted(hits.items()):
        page = fetch(wiki_id)["data"]["page"]
        skills = extract_skills(page)
        profile = extract_profile(page)
        by_name[name] = {
            "wikiId": wiki_id,
            "skills": skills,
            "description": profile,
        }

    for item in bangboo:
        name = item["name"]
        if name in by_name:
            continue
        index_name = INDEX_ALIASES.get(name, name)
        if index_name in index_skills:
            by_name[name] = {
                "wikiId": 545,
                "skills": [
                    {
                        "tab": "技能",
                        "title": "",
                        "desc": index_skills[index_name],
                        "detail": "",
                        "levels": 1,
                    }
                ],
                "description": "",
            }

    missing = [item["name"] for item in bangboo if item["name"] not in by_name]
    OUT.write_text(
        json.dumps({"byName": by_name, "missing": missing}, ensure_ascii=False, indent=1),
        encoding="utf-8",
    )
    print(f"entries {len(by_name)} | missing {missing}")


if __name__ == "__main__":
    main()
