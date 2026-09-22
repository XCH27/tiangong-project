#!/usr/bin/env python3
"""Validate canonical documentation joins without inferring implementation status."""

from __future__ import annotations

import re
import sys
import runpy
from pathlib import Path
from doc_execution_contracts import validate_execution_contracts, validate_local_links


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
# Only §3A's registry rows *define* a surface ID. Harvesting every "P-NN" mention in the file would
# let a typo define itself: writing P-99 in a reference would silently add P-99 to the known set.
known_pages = set(re.findall(r"^\| (P-\d{2}) \|", page_text, re.M))
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

# §3's T1-T17 target pages and §3A's P-01..P-60 surfaces describe overlapping things in one file.
# The T rows now declare their surface IDs so the overlap is checkable instead of implied.
for line in page_text.splitlines():
    t_match = re.match(r"^\| (T\d+) \| [^|]* \| ([^|]*) \|", line)
    if not t_match:
        continue
    target, declared = t_match.group(1), t_match.group(2).strip()
    if declared == "—":
        continue
    if not declared:
        errors.append(f"target page {target}: missing Surface IDs join (use '—' if none applies)")
        continue
    for surface in (part.strip() for part in declared.split(",")):
        if not re.fullmatch(r"P-\d{2}", surface):
            errors.append(f"target page {target}: malformed surface ID {surface!r}")
        elif surface not in known_pages:
            errors.append(f"target page {target}: unknown surface ID {surface}")

# 11-PRODUCT-MATRIX.md is keyed by domain name, not capability ID. Without a declared join it sits
# outside every check above, which is how a domain such as "External computer/environment control"
# reached an R16 acceptance anchor with no registry row behind it. Sections A-F must therefore
# declare their registry IDs in column 2; section G (technology routes) is a different table shape
# and is exempt.
matrix_text = read(DOCS / "11-PRODUCT-MATRIX.md")
matrix_ids: set[str] = set()
matrix_section: str | None = None
id_pattern = re.compile(r"^(?:CORE|INFO|EXEC|INTEL|CREATE|ORCH)-\d{2}$")

for line in matrix_text.splitlines():
    section_match = re.match(r"^## ([A-G])\.", line)
    if section_match:
        matrix_section = section_match.group(1)
        continue
    if matrix_section not in {"A", "B", "C", "D", "E", "F"} or not line.startswith("|"):
        continue

    cells = line.split("|")
    if len(cells) < 3:
        continue
    domain, declared = cells[1].strip(), cells[2].strip()
    if not domain or domain == "Domain" or set(domain) <= {"-", " "}:
        continue

    if declared == "—":
        continue  # explicit, deliberate coverage gap
    if not declared:
        errors.append(f"matrix row '{domain}': missing Registry IDs join (use '—' if none applies)")
        continue
    for candidate in (part.strip() for part in declared.split(",")):
        if not id_pattern.match(candidate):
            errors.append(f"matrix row '{domain}': malformed registry ID {candidate!r}")
        elif candidate not in set(registry_ids):
            errors.append(f"matrix row '{domain}': unknown registry ID {candidate}")
        else:
            matrix_ids.add(candidate)

errors.extend(validate_execution_contracts(ROOT, registry_ids, packet_text))
link_errors, internal_links, external_links = validate_local_links(ROOT)
errors.extend(link_errors)
try:
    guide_module = runpy.run_path(str(ROOT / 'scripts/reference-guides.py'))
    reference_sources, reference_routes, _ = guide_module['read_catalog'](ROOT)
except (ValueError, KeyError, IndexError, OSError) as error:
    errors.append(f'reference adaptation contract: {error}')

if errors:
    print("documentation contract validation failed:")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

# Coverage is reported, not enforced: several registry rows are deliberately folded into a broader
# matrix domain or covered by section G. A growing list is a prompt to check, not a failure.
uncovered = sorted(set(registry_ids) - matrix_ids)

print(
    f"documentation contracts valid: {len(registry_ids)} capability IDs, "
    f"{len(known_pages)} page IDs, {len(known_acceptance)} acceptance IDs, "
    f"{len(matrix_ids)} matrix-joined IDs; execution ownership and source paths valid; "
    f"{len(reference_routes)} reference adaptation routes; {internal_links} internal links"
)
if external_links:
    print(f"external reference links: {external_links}; mount/source-lock validation belongs to reference-guides.py --check")
if uncovered:
    print(f"note: {len(uncovered)} registry IDs have no A-F matrix row: {', '.join(uncovered)}")
