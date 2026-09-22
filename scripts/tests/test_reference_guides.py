import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('reference_guides', Path(__file__).resolve().parents[1] / 'reference-guides.py')
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
CURRENT = 'abcdef1234567890abcdef1234567890abcdef12'


class ReferenceGuides(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / 'fleet'
        self.refs = Path(self.tmp.name) / 'references'
        self.checkout = self.refs / 'software/example'
        (self.checkout / '.git').mkdir(parents=True)
        registry = self.root / 'docs/REFERENCES.md'
        registry.parent.mkdir(parents=True)
        (self.checkout / 'CONTRIBUTING.md').write_text('Development entry point')
        registry.write_text(f'''| [software/example](https://github.com/example/repo) · `123456abcdef` · MIT | `src/main.ts#run` | **C** — bounded mechanism only |
## Current checkouts and development-document intake

| `software/example` | `{CURRENT}` (main; updated) | `CONTRIBUTING.md` | Bounded documentation evidence only. |
## Per-project adaptation routes

| Checkout | Fleet execution contracts |
|---|---|
| `software/example` | [CORE-01](features/SYS-01-test.md#execution-core-01) |
''')
        suite = self.root / 'docs/features/SYS-01-test.md'
        suite.parent.mkdir(parents=True)
        suite.write_text('### Execution CORE-01\n\n- **Next:** `IMPLEMENT` — R0.\n')
        self.git = patch.object(MODULE, 'git', side_effect=lambda _p, *args: CURRENT if args[0] == 'rev-parse' else 'https://github.com/example/repo.git')
        self.git.start()
        self.addCleanup(self.git.stop)

    def test_render_is_deterministic_and_does_not_mutate_checkout(self):
        first = MODULE.planned_guides(self.root, self.refs)
        self.assertEqual(first, MODULE.planned_guides(self.root, self.refs))
        self.assertFalse((self.checkout / MODULE.FILENAME).exists())
        text = next(iter(first.values()))
        self.assertIn('src/main.ts#run', text)
        self.assertIn('#execution-core-01', text)
        self.assertIn(CURRENT, text)
        self.assertIn('Historical mechanism review: `123456abcdef`', text)
        self.assertIn('[CONTRIBUTING.md](CONTRIBUTING.md)', text)

    def test_fleet_links_do_not_depend_on_reference_symlink_location(self):
        registry = self.root / 'docs/REFERENCES.md'
        dest = MODULE.link(registry, self.checkout, '#per-project-adaptation-routes')
        self.assertTrue(dest.startswith('/'))
        self.assertNotIn('../', dest)
        self.assertTrue(dest.endswith('#per-project-adaptation-routes'))

    def test_manual_file_and_symlink_are_preserved(self):
        target = self.checkout / MODULE.FILENAME
        target.write_text('owner notes')
        with self.assertRaisesRegex(ValueError, 'non-generated'):
            MODULE.planned_guides(self.root, self.refs)
        self.assertEqual(target.read_text(), 'owner notes')
        target.unlink()
        target.symlink_to(self.checkout / 'not-created')
        with self.assertRaisesRegex(ValueError, 'non-generated'):
            MODULE.planned_guides(self.root, self.refs)

    def test_changed_head_and_origin_require_new_review(self):
        with patch.object(MODULE, 'git', return_value='different'):
            with self.assertRaisesRegex(ValueError, 'unrecorded HEAD'):
                MODULE.planned_guides(self.root, self.refs)
        with patch.object(MODULE, 'git', side_effect=[CURRENT, 'https://github.com/unreviewed/repo']):
            with self.assertRaisesRegex(ValueError, 'unreviewed origin'):
                MODULE.planned_guides(self.root, self.refs)

    def test_missing_or_escaping_upstream_document_blocks_generation(self):
        source = self.checkout / 'CONTRIBUTING.md'
        source.unlink()
        with self.assertRaisesRegex(ValueError, 'documentation unavailable'):
            MODULE.planned_guides(self.root, self.refs)
        outside = self.root / 'outside.md'
        outside.write_text('not in checkout')
        source.symlink_to(outside)
        with self.assertRaisesRegex(ValueError, 'escapes checkout'):
            MODULE.planned_guides(self.root, self.refs)

    def test_every_source_requires_exactly_one_current_observation(self):
        registry = self.root / 'docs/REFERENCES.md'
        text = registry.read_text()
        line = next(line for line in text.splitlines() if CURRENT in line)
        registry.write_text(text.replace(line, ''))
        with self.assertRaisesRegex(ValueError, 'current checkout mismatch'):
            MODULE.read_catalog(self.root)
        registry.write_text(text.replace(line, line + '\n' + line))
        with self.assertRaisesRegex(ValueError, 'duplicate current checkout'):
            MODULE.read_catalog(self.root)

    def test_unknown_capability_does_not_generate_a_guide(self):
        registry = self.root / 'docs/REFERENCES.md'
        registry.write_text(registry.read_text().replace('[CORE-01]', '[CORE-99]'))
        with self.assertRaisesRegex(ValueError, 'missing execution contract'):
            MODULE.planned_guides(self.root, self.refs)


if __name__ == '__main__':
    unittest.main()
