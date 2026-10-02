import importlib.util
from pathlib import Path
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location('doc_execution_contracts', Path(__file__).resolve().parents[1] / 'doc_execution_contracts.py')
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class ExecutionContracts(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.packet = self.root / 'docs/modules/test.md'
        self.packet.parent.mkdir(parents=True)
        (self.root / 'app').mkdir()
        (self.root / 'app/owner.ts').write_text('export const owner = true')
        self.body = '''### Execution CORE-01

- **Next:** `IMPLEMENT` — R0.
- **Sources:** [owner](../../app/owner.ts).
- **Deliver:** One real mutation.
- **Data:** Existing owner.
- **Failure:** Preserve bytes on failure.
- **Proof:** CORE-01-A round trip. Planned regression/probe target: `owner.test.ts`.
- **Reference:** [reference registry](../references.md).
'''
        self.packet.write_text(self.body)
        self.row = '| CORE-01 | Test capability | Work Core | REUSE | not implemented | modules/test.md | P-01 | R0 / CORE-01-A | READY_FOR_SPEC | Craft owner |'

    def check(self):
        return MODULE.validate_execution_contracts(self.root, ['CORE-01'], self.row)

    def test_valid_current_path_and_contract(self):
        self.assertEqual(self.check(), [])

    def test_wrapped_contract_fields_do_not_require_giant_single_line_paragraphs(self):
        self.packet.write_text(self.body.replace('[owner]', '[source\nowner]').replace(
            'regression/probe target:', 'regression/probe\ntarget:').replace(
            '[reference registry]', '[reference\nregistry]'))
        self.assertEqual(self.check(), [])

    def test_active_candidate_sources_and_existing_regressions_are_checked_in_their_own_scope(self):
        candidate = self.root / '.fleet/zcode'
        candidate.mkdir(parents=True)
        (candidate / 'owner.ts').write_text('// active source')
        (candidate / 'owner.test.ts').write_text('// real regression')
        body = self.body.replace('../../app/owner.ts', '../../.fleet/zcode/owner.ts').replace(
            'Planned regression/probe target:', 'Existing regression target relative to `.fleet/zcode/`:')
        self.packet.write_text(body)
        self.assertEqual(self.check(), [])
        (candidate / 'owner.test.ts').unlink()
        self.assertTrue(any('existing regression target missing' in error for error in self.check()))

    def test_future_path_cannot_claim_current_entry(self):
        (self.root / 'app/owner.ts').unlink()
        self.assertTrue(any('source missing' in e for e in self.check()))

    def test_existing_regression_target_requires_a_real_file_in_app(self):
        self.packet.write_text(self.body.replace('Planned regression/probe target:', 'Existing regression target relative to `app/`:'))
        self.assertTrue(any('existing regression target missing' in e for e in self.check()))
        (self.root / 'app/owner.test.ts').write_text('// regression fixture')
        self.assertEqual(self.check(), [])
        self.packet.write_text(self.packet.read_text().replace('`owner.test.ts`', '`../outside.test.ts`'))
        self.assertTrue(any('regression target outside app' in e for e in self.check()))

    def test_missing_and_duplicate_owners_fail(self):
        self.packet.write_text('')
        self.assertTrue(any('coverage mismatch' in e for e in self.check()))
        self.packet.write_text(self.body + '\n' + self.body)
        self.assertTrue(any('duplicate execution owner' in e for e in self.check()))

    def test_wrong_route_and_invalid_state_fail(self):
        self.row = self.row.replace('test.md', 'missing.md')
        self.assertTrue(any('execution owner' in e for e in self.check()))
        self.row = self.row.replace('READY_FOR_SPEC', 'READY_BY_ACCIDENT')
        self.assertTrue(any('malformed capability row' in e for e in self.check()))

    def test_missing_recovery_and_false_proof_promotion_fail(self):
        self.packet.write_text(self.body.replace('- **Failure:** Preserve bytes on failure.\n', '').replace('`IMPLEMENT`', '`PROVE`'))
        errors = self.check()
        self.assertTrue(any('Failure' in e for e in errors))
        self.assertTrue(any('unselected PROVE' in e for e in errors))

    def test_local_links_fail_for_missing_target_and_heading(self):
        readme = self.root / 'README.md'
        readme.write_text('[missing](docs/missing.md)\n[wrong](docs/modules/test.md#unknown)')
        errors, _, _ = MODULE.validate_local_links(self.root)
        self.assertTrue(any('missing local link' in e for e in errors))
        self.assertTrue(any('missing heading' in e for e in errors))

    def test_reference_mount_is_separate_from_ci_links(self):
        (self.root / 'README.md').write_text('[reference](源码参考/software/example/README.md)')
        _, _, external = MODULE.validate_local_links(self.root)
        self.assertEqual(external, 1)


if __name__ == '__main__':
    unittest.main()
