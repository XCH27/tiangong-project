#!/usr/bin/env python3
"""Validate canonical documentation joins without inferring implementation status."""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"


def read(path: Path) -> str:
    if not path.is_file():
        raise SystemExit(f"missing required file: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def table_ids(text: str) -> list[str]:
    return re.findall(r"^\| ((?:CORE|INFO|EXEC|INTEL|CREATE|ORCH)-\d{2}) \|", text, re.M)


errors: list[str] = []
registry_ids = table_ids(read(DOCS / "modules/REGISTRY.md"))
packet_text = read(DOCS / "modules/PACKET-INDEX.md")
packet_ids = table_ids(packet_text)

if len(registry_ids) != len(set(registry_ids)):
    errors.append("REGISTRY.md contains duplicate capability IDs")
if len(packet_ids) != len(set(packet_ids)):
    errors.append("PACKET-INDEX.md contains duplicate capability IDs")
if set(registry_ids) != set(packet_ids):
    errors.append(
        "registry/packet ID mismatch: "
        f"missing={sorted(set(registry_ids) - set(packet_ids))}, "
        f"extra={sorted(set(packet_ids) - set(registry_ids))}"
    )

page_text = read(DOCS / "12-PAGE-ARCHITECTURE.md")
known_pages = set(re.findall(r"\bP-\d{2}\b", page_text))
acceptance_text = read(DOCS / "modules/ACCEPTANCE-INDEX.md")
known_acceptance = set(re.findall(r"\b(?:[A-Z]+-\d{2}-A|[A-Z]+-\d{3})\b", acceptance_text))
valid_states = {"BREADTH_ONLY", "PACKET_DRAFT", "READY_FOR_SPEC"}

for line in packet_text.splitlines():
    match = re.match(
        r"^\| ((?:CORE|INFO|EXEC|INTEL|CREATE|ORCH)-\d{2}) \|.*?\| (.*?) \| (.*?) \| (.*?) \| (BREADTH_ONLY|PACKET_DRAFT|READY_FOR_SPEC) \|$",
        line,
    )
    if not match:
        continue
    capability, packet, pages, anchor_and_acceptance, state = match.groups()
    if state not in valid_states:
        errors.append(f"{capability}: invalid packet state {state}")
    for page in re.findall(r"\bP-\d{2}\b", pages):
        if page not in known_pages:
            errors.append(f"{capability}: unknown page {page}")
    acceptance_part = anchor_and_acceptance.split("/", 1)[-1]
    for acceptance in re.findall(r"\b(?:[A-Z]+-\d{2}-A|[A-Z]+-\d{3})\b", acceptance_part):
        if acceptance not in known_acceptance:
            errors.append(f"{capability}: unknown acceptance ID {acceptance}")
    if packet != "—" and not (DOCS / "modules" / packet).is_file():
        errors.append(f"{capability}: missing packet docs/modules/{packet}")
    if not re.search(r"\b(?:TE1|R(?:[0-9]|1[0-8]))\b", anchor_and_acceptance):
        errors.append(f"{capability}: missing TE1/R0-R18 development-order anchor")

if errors:
    print("documentation contract validation failed:")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print(
    f"documentation contracts valid: {len(registry_ids)} capability IDs, "
    f"{len(known_pages)} page IDs, {len(known_acceptance)} acceptance IDs"
)
