#!/usr/bin/env python3
"""Audit MLS-SND inventory, registry, entry files and STATUS.md.

Read-only and dependency-free.

Usage:
  python docs/pronunciation/tools/reconcile_status.py
  python docs/pronunciation/tools/reconcile_status.py --json
  python docs/pronunciation/tools/reconcile_status.py --strict
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SND = ROOT / "docs" / "pronunciation"
INVENTORY = SND / "MLS-SND-MASTER-INVENTORY.md"
REGISTRY = SND / "MLS-SND-SOURCE-REGISTRY.md"
STATUS = SND / "STATUS.md"

ENTRY_DIRS = (
    SND / "fundamentals",
    SND / "representation",
    SND / "languages",
    SND / "comparative",
    SND / "reference",
)

ID_RE = re.compile(
    r"\bSND-(?:FND|REP|ESGT|ENUS|PTBR|IT|FR|DE|ZHTW|KO|JA|RU|CMP|REF)-\d{3}\b"
)
ENTRY_FILENAME_RE = re.compile(r"^(SND-[A-Z0-9]+-\d{3})(?:-|\.md)")
SOURCE_RE = re.compile(r"\bSND-SRC-\d{4}\b")
SOURCE_HEADING_RE = re.compile(r"^###\s+(SND-SRC-\d{4})\b", re.M)
STATE_RE = re.compile(r"\*\*Estado:\*\*\s*([A-Z][A-Z0-9_]*(?:\s*\([^)]*\))?)")
INV_ROW_RE = re.compile(
    r"^\|\s*(SND-[A-Z0-9]+-\d{3})\s*\|.*\|\s*"
    r"([A-Z][A-Z0-9_]*(?:\s*\([^)]*\))?)\s*\|\s*$"
)
LOCAL_SOURCE_RE = re.compile(r"\b[A-Z][A-Z0-9-]*-PROP-\d+\b")


def read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError:
        raise SystemExit(f"Missing required file: {path.relative_to(ROOT)}")


def declared(pattern: str, text: str) -> int | None:
    m = re.search(pattern, text, flags=re.I)
    return int(m.group(1)) if m else None


def entry_files() -> list[Path]:
    out: list[Path] = []
    for directory in ENTRY_DIRS:
        if directory.exists():
            out.extend(p for p in directory.rglob("SND-*.md") if p.is_file())
    return sorted(set(out))


def entry_id(path: Path) -> str | None:
    m = ENTRY_FILENAME_RE.match(path.name)
    return m.group(1) if m else None


def state(text: str) -> str:
    m = STATE_RE.search(text)
    return m.group(1).strip() if m else "UNKNOWN"


def inventory_data(text: str) -> tuple[list[str], dict[str, str]]:
    ids = ID_RE.findall(text)
    states: dict[str, str] = {}
    for line in text.splitlines():
        m = INV_ROW_RE.match(line)
        if m:
            states[m.group(1)] = m.group(2).strip()
    return ids, states


def audit() -> dict:
    inv_text = read(INVENTORY)
    reg_text = read(REGISTRY)
    status_text = read(STATUS)

    inv_mentions, inv_states = inventory_data(inv_text)
    inv_ids = sorted(set(inv_mentions))

    source_headings = SOURCE_HEADING_RE.findall(reg_text)
    source_counts = Counter(source_headings)
    source_ids = sorted(source_counts)

    entries: dict[str, str] = {}
    entry_paths: dict[str, list[str]] = defaultdict(list)
    cited_sources: set[str] = set()
    local_sources: dict[str, list[str]] = defaultdict(list)

    for path in entry_files():
        text = read(path)
        eid = entry_id(path)
        if not eid:
            continue
        rel = str(path.relative_to(ROOT))
        entries[eid] = state(text)
        entry_paths[eid].append(rel)
        cited_sources.update(SOURCE_RE.findall(text))
        for sid in sorted(set(LOCAL_SOURCE_RE.findall(text))):
            local_sources[sid].append(rel)

    duplicate_entries = {k: v for k, v in entry_paths.items() if len(v) > 1}
    duplicate_sources = {k: v for k, v in source_counts.items() if v > 1}

    mismatches = []
    for eid, file_state in sorted(entries.items()):
        inv_state = inv_states.get(eid)
        if inv_state != file_state:
            mismatches.append(
                {"id": eid, "file_state": file_state, "inventory_state": inv_state}
            )

    physical_not_in_inventory = sorted(set(entries) - set(inv_ids))
    missing_sources = sorted(cited_sources - set(source_ids))
    states = Counter(entries.values())
    prefixes = Counter(i.split("-")[1] for i in inv_ids)
    profile_prefixes = {
        "ESGT", "ENUS", "PTBR", "IT", "FR", "DE", "ZHTW", "KO", "JA", "RU"
    }
    profile_total = sum(prefixes[p] for p in profile_prefixes)

    declared_inventory = declared(r"Total inicial inventariado:\s*(\d+)", inv_text)
    declared_profiles = declared(r"Perfiles lingüísticos:\s*(\d+)", inv_text)
    declared_entries = declared(r"Entradas presentes[^:]*:\s*(\d+)", status_text)
    declared_sources = declared(
        r"Source Registry\s*\|\s*v[\d.]+\s*—\s*(\d+)\s+fuentes canónicas",
        status_text,
    )

    errors: list[str] = []
    warnings: list[str] = []

    if declared_inventory != len(inv_ids):
        errors.append(
            f"Inventory declares {declared_inventory}; unique IDs: {len(inv_ids)}."
        )
    if declared_profiles != profile_total:
        errors.append(
            f"Inventory declares {declared_profiles} profile units; computed: "
            f"{profile_total}."
        )
    if declared_entries != len(entries):
        warnings.append(
            f"STATUS declares {declared_entries} entries; physical entries: "
            f"{len(entries)}."
        )
    if declared_sources != len(source_ids):
        warnings.append(
            f"STATUS declares {declared_sources} sources; registry IDs: "
            f"{len(source_ids)}."
        )
    if duplicate_entries:
        errors.append(f"Duplicate entry IDs: {sorted(duplicate_entries)}")
    if duplicate_sources:
        errors.append(f"Duplicate source IDs: {sorted(duplicate_sources)}")
    if physical_not_in_inventory:
        errors.append(
            "Physical entries missing from inventory: "
            + ", ".join(physical_not_in_inventory)
        )
    if missing_sources:
        errors.append(
            "Cited source IDs missing from registry: " + ", ".join(missing_sources)
        )
    if mismatches:
        warnings.append(f"{len(mismatches)} file/inventory state mismatches.")

    return {
        "inventory": {
            "declared_total": declared_inventory,
            "computed_unique_ids": len(inv_ids),
            "declared_profile_total": declared_profiles,
            "computed_profile_total": profile_total,
            "by_prefix": dict(sorted(prefixes.items())),
        },
        "entries": {
            "count": len(entries),
            "state_counts": dict(sorted(states.items())),
            "duplicate_ids": duplicate_entries,
            "physical_not_in_inventory": physical_not_in_inventory,
            "inventory_state_mismatches": mismatches,
        },
        "sources": {
            "count": len(source_ids),
            "duplicate_ids": duplicate_sources,
            "cited_count": len(cited_sources),
            "missing_cited_ids": missing_sources,
            "local_source_ids": dict(sorted(local_sources.items())),
        },
        "status": {
            "declared_entries": declared_entries,
            "declared_sources": declared_sources,
        },
        "errors": errors,
        "warnings": warnings,
    }


def human(result: dict) -> str:
    inv = result["inventory"]
    ent = result["entries"]
    src = result["sources"]
    st = result["status"]

    lines = [
        "MLS-SND reconciliation audit",
        "============================",
        f"Inventory IDs: {inv['computed_unique_ids']} "
        f"(declared: {inv['declared_total']})",
        f"Profile units: {inv['computed_profile_total']} "
        f"(declared: {inv['declared_profile_total']})",
        f"Physical entries: {ent['count']} "
        f"(STATUS declares: {st['declared_entries']})",
        f"Registry sources: {src['count']} "
        f"(STATUS declares: {st['declared_sources']})",
        "",
        "Entry states:",
    ]
    for name, count in ent["state_counts"].items():
        lines.append(f"  {name}: {count}")

    if ent["inventory_state_mismatches"]:
        lines.extend(["", "Inventory/file state mismatches:"])
        for row in ent["inventory_state_mismatches"]:
            lines.append(
                f"  {row['id']}: file={row['file_state']} "
                f"inventory={row['inventory_state']}"
            )

    if src["missing_cited_ids"]:
        lines.extend(["", "Missing cited source IDs:"])
        lines.extend(f"  {sid}" for sid in src["missing_cited_ids"])

    if src["local_source_ids"]:
        lines.extend(["", "Local/proposed source IDs still present:"])
        for sid, paths in src["local_source_ids"].items():
            lines.append(f"  {sid}: {len(paths)} file(s)")

    if result["errors"]:
        lines.extend(["", "ERRORS:"])
        lines.extend(f"  - {msg}" for msg in result["errors"])
    if result["warnings"]:
        lines.extend(["", "WARNINGS:"])
        lines.extend(f"  - {msg}" for msg in result["warnings"])
    if not result["errors"] and not result["warnings"]:
        lines.extend(["", "PASS: no reconciliation drift detected."])
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--strict", action="store_true")
    args = parser.parse_args()

    result = audit()
    print(
        json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True)
        if args.json
        else human(result)
    )

    if result["errors"]:
        return 2
    if args.strict and result["warnings"]:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
