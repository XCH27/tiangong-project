"""Check executable handoff structure and real source paths; never infer product readiness."""
from pathlib import Path
import os
import re
from urllib.parse import unquote

ID = r'(?:CORE|INFO|EXEC|INTEL|CREATE|ORCH)-\d{2}'
FIELDS = {'Next', 'Sources', 'Deliver', 'Data', 'Failure', 'Proof', 'Reference'}


def validate_local_links(root: Path) -> tuple[list[str], int, int]:
    """Check internal links; external reference mounts are a separately reported local check."""
    errors, checked, external = [], 0, 0
    files = [root / 'README.md', root / 'AGENTS.md', *sorted((root / 'docs').rglob('*.md'))]
    for path in files:
        if not path.is_file():
            continue
        # Examples in fenced code are not navigation links.
        text = re.sub(r'^```.*?^```\s*$', '', path.read_text(), flags=re.M | re.S)
        for target in re.findall(r'\[[^\]]*\]\((<[^>]+>|[^\s)]+)(?:\s+[^)]*)?\)', text):
            target = unquote(target.strip('<>'))
            if re.match(r'[a-zA-Z][a-zA-Z0-9+.-]*:', target):
                continue
            base, _, anchor = target.partition('#')
            dest = Path(os.path.normpath(path.parent / base)) if base else path
            if any(dest.is_relative_to(root / name) for name in ('源码参考', 'UI参考')):
                external += 1
                continue
            if not dest.exists():
                errors.append(f'{path.relative_to(root)}: missing local link {target}')
                continue
            checked += 1
            if not anchor or not dest.is_file() or dest.suffix != '.md':
                continue
            contents = dest.read_text()
            headings, repeats = set(), {}
            for heading in re.findall(r'^#{1,6}\s+(.+)$', contents, re.M):
                heading = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', heading)
                heading = re.sub(r'[`*_]', '', heading)
                heading = re.sub(r'<[^>]+>', '', heading)
                slug = re.sub(r'[^\w\-\s]', '', heading.lower())
                slug = re.sub(r'\s', '-', slug.strip())
                suffix = repeats.get(slug, 0)
                repeats[slug] = suffix + 1
                headings.add(slug + (f'-{suffix}' if suffix else ''))
            if anchor not in headings and not re.search(rf'(?:id|name)=[\"\']{re.escape(anchor)}[\"\']', contents):
                errors.append(f'{path.relative_to(root)}: missing heading {target}')
    return errors, checked, external


def validate_execution_contracts(root: Path, registry_ids: list[str], packet_text: str) -> list[str]:
    errors = []
    owners = {}
    bodies = {}
    for path in (root / 'docs/modules/suites').glob('SYS-*.md'):
        for match in re.finditer(rf'^### Execution ({ID})\n(.*?)(?=^### Execution |\Z)', path.read_text(), re.M | re.S):
            identity, body = match.groups()
            if identity in owners:
                errors.append(f'{identity}: duplicate execution owner')
            owners[identity] = path
            bodies[identity] = body
            fields = dict(re.findall(r'^- \*\*(\w+):\*\* (.*)$', body, re.M))
            missing = FIELDS - fields.keys()
            if missing:
                errors.append(f'{identity}: missing execution fields {sorted(missing)}')
            if not re.match(r'`(?:IMPLEMENT|PROVE|CLOSED)` — .+', fields.get('Next', '')):
                errors.append(f'{identity}: missing bounded next-action/gate')
            links = re.findall(r'\]\(([^)]+)\)', fields.get('Sources', ''))
            if not links:
                errors.append(f'{identity}: no linked current source entry')
            for dest in links:
                candidate = (path.parent / unquote(dest.split('#')[0])).resolve()
                if not candidate.is_relative_to((root / 'app').resolve()) or not candidate.is_file():
                    errors.append(f'{identity}: current app source missing or outside app: {dest}')
            if f'{identity}-A' not in fields.get('Proof', ''):
                errors.append(f'{identity}: proof lacks canonical acceptance ID')
            regression = re.search(r'(Planned|Existing) regression(?:/probe)? target(?: relative to `app/`)?\s*:\s*`([^`]+)`', fields.get('Proof', ''))
            if not regression:
                errors.append(f'{identity}: no named regression/probe target')
            else:
                regression_path = (root / 'app' / regression.group(2)).resolve()
                if not regression_path.is_relative_to((root / 'app').resolve()):
                    errors.append(f'{identity}: regression target outside app')
                elif regression.group(1) == 'Existing' and not regression_path.is_file():
                    errors.append(f'{identity}: existing regression target missing')
            if '[reference registry]' not in fields.get('Reference', ''):
                errors.append(f'{identity}: missing canonical source route')
    if set(owners) != set(registry_ids):
        errors.append(f'execution coverage mismatch: missing={sorted(set(registry_ids)-owners.keys())}, extra={sorted(owners.keys()-set(registry_ids))}')
    for line in packet_text.splitlines():
        if not re.match(rf'^\| {ID} \|', line):
            continue
        cells = [c.strip() for c in line.split('|')]
        identity = cells[1]
        if len(cells) != 8 or cells[6] not in {'BREADTH_ONLY', 'PACKET_DRAFT', 'READY_FOR_SPEC'}:
            errors.append(f'{identity}: malformed packet row/state')
            continue
        expected = (root / 'docs/modules' / cells[3]).resolve()
        if identity not in owners or expected != owners[identity].resolve():
            errors.append(f'{identity}: packet does not route to its execution owner')
        if cells[6] == 'READY_FOR_SPEC' and '**Next:** `PROVE`' in bodies.get(identity, ''):
            errors.append(f'{identity}: unselected PROVE route cannot be READY_FOR_SPEC')
    return errors
