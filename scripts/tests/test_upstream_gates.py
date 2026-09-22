"""Regression coverage for omissions that previously made Fleet's baseline gates pass."""
import importlib.util
import contextlib
import io
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))
from upstream_contract import ContractError, ReferenceUnavailable, inventory, read_ledger, validate_reference


def load(name):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


delta = load("check-upstream-delta")
orphans = load("check-orphaned-components")


class GateTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="fleet-gate-test-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def write(self, rel, content):
        path = self.root / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        return path

    def ledger(self, row):
        return read_ledger(self.write("delta.tsv", "path\tlayer\treason\n" + row))

    def test_inventory_keeps_tracked_build_hook_and_security_files(self):
        subprocess.run(["git", "init", "-q", str(self.root)], check=True)
        tracked = {"scripts/build/common.ts", "apps/electron/build/entitlements.mac.plist", ".husky/pre-commit"}
        for rel in tracked:
            self.write("app/" + rel, "tracked")
        subprocess.run(["git", "-C", str(self.root), "add", "app"], check=True)
        self.write("app/.gitignore", "build/\n.husky/\nnode_modules/\n")
        self.write("app/node_modules/generated.js", "ignored")
        self.write("app/new-source.ts", "new")
        self.assertEqual(inventory(self.root, "app", True), tracked | {".gitignore", "new-source.ts"})

    def test_difference_detects_deleted_files_and_changes_under_build(self):
        self.write("app/scripts/build/common.ts", "changed")
        self.write("pin/scripts/build/common.ts", "original")
        self.write("pin/component.tsx", "original")
        paths = {"scripts/build/common.ts", "component.tsx"}
        self.assertEqual(delta.differences(self.root / "app", self.root / "pin", paths, paths),
                         {"scripts/build/common.ts", "MISSING:component.tsx"})

    def test_symlink_is_compared_without_following_its_target(self):
        self.write("app/target", "private")
        self.write("pin/target", "different")
        (self.root / "app/link").symlink_to("target")
        (self.root / "pin/link").symlink_to("target")
        self.assertEqual(delta.differences(self.root / "app", self.root / "pin", {"link"}, {"link"}), set())

    def test_ledger_rejects_missing_reason_invalid_layer_and_duplicates(self):
        for row in ["a\tL0\t\n", "a\tBAD\treason\n", "a\tL0\treason\na\tL1\treason\n", "../a\tL0\treason\n", "a\tL2\treplacement: new location\n"]:
            with self.subTest(row=row), self.assertRaises(ContractError):
                self.ledger(row)

    def test_removed_component_requires_exact_l2_classification_and_destination(self):
        rel = "components/Widget.tsx"
        for row in [f"{rel}\tL1\treplacement: Panel.tsx\n", f"{rel}\tL2\tEXTEND removed\n", "components/Widget.tsx.helper\tL2\tEXTEND replacement: Panel.tsx\n"]:
            with self.subTest(row=row):
                self.assertFalse(orphans.removal_declared(rel, self.ledger(row)))
        self.assertTrue(orphans.removal_declared(rel, self.ledger(f"MISSING:{rel}\tL2\tEXTEND replacement: Panel.tsx\n")))
        self.assertTrue(orphans.removal_declared(rel, self.ledger(f"App.tsx\tL2\tEXTEND removes: {rel}; replacement: Panel.tsx\n")))
        self.assertFalse(orphans.removal_declared(rel, self.ledger(f"App.tsx\tL2\tEXTEND removes: {rel}.helper; replacement: Panel.tsx\n")))

    def test_imports_comments_strings_and_reexports_do_not_count(self):
        text = '''import { Widget } from './Widget'
import {
  Widget as Alias
} from './Widget'
export { Widget } from './Widget'
// Widget
/* Widget */
const label = "Widget"
const template = `Widget`
export const App = () => null
'''
        self.assertNotIn("Widget", orphans.code_identifiers(text))
        self.assertNotIn("Alias", orphans.code_identifiers(text))

    def test_production_render_and_registry_reference_still_count(self):
        self.assertIn("Widget", orphans.code_identifiers("import { Widget } from './Widget'\nexport const App = () => <Widget />"))
        self.assertIn("Widget", orphans.code_identifiers("const panels = { widget: Widget }"))
        self.assertIn("Widget", orphans.code_identifiers("React.createElement(Widget)"))

    def test_test_and_playground_callers_are_excluded(self):
        paths = {"src/App.tsx", "src/App.test.tsx", "src/App.isolated.tsx", "src/App.spec.ts", "playground/App.tsx", "src/__tests__/App.tsx", "tests/App.tsx"}
        self.assertEqual(orphans.sources(paths), {"src/App.tsx"})

    def test_removed_mount_fails_even_when_import_test_and_comment_remain(self):
        component = "src/Widget.tsx"
        mount = "import { Widget } from './Widget'\nexport const App = () => <Widget />\n"
        self.write("pin/" + component, "export const Widget = () => null\n")
        self.write("app/" + component, "export const Widget = () => null\n")
        self.write("pin/src/App.tsx", mount)
        self.write("app/src/App.tsx", "import { Widget } from './Widget'\n// Widget formerly mounted here\nexport const App = () => null\n")
        self.write("app/src/Widget.test.tsx", mount)
        self.write("app/playground/WidgetDemo.tsx", mount)
        ledger = self.write("delta.tsv", "path\tlayer\treason\n")
        def fixture_inventory(root, *args, **kwargs):
            tree = self.root / "pin" if root == self.root / "pin" else self.root / "app"
            return {str(path.relative_to(tree)) for path in tree.rglob("*.tsx")}
        with patch.object(orphans, "ROOT", self.root), patch.object(orphans, "APP", self.root / "app"), \
             patch.object(orphans, "PIN", self.root / "pin"), patch.object(orphans, "LEDGER", ledger), \
             patch.object(orphans, "inventory", side_effect=fixture_inventory), \
             patch.object(orphans, "validate_reference", return_value="v0.13.4"), \
            contextlib.redirect_stderr(io.StringIO()), contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(orphans.main(), 1)
            ledger.write_text(f"path\tlayer\treason\nsrc/App.tsx\tL2\tEXTEND removes: {component}; replacement: settings panel\n", encoding="utf-8")
            self.assertEqual(orphans.main(), 0)
            self.assertEqual(delta.differences(self.root / "app", self.root / "pin",
                                             {component, "src/App.tsx"}, {component, "src/App.tsx"}),
                             {"src/App.tsx"}, "only the actual changed caller needs a delta row")
            ledger.write_text("path\tlayer\treason\n", encoding="utf-8")
            self.write("app/src/App.tsx", mount)
            self.assertEqual(orphans.main(), 0)

    def test_delta_gate_rejects_undeclared_and_stale_entries(self):
        self.write("pin/source.ts", "upstream")
        self.write("app/source.ts", "changed")
        ledger = self.write("delta.tsv", "path\tlayer\treason\n")
        with patch.object(delta, "APP", self.root / "app"), patch.object(delta, "PIN", self.root / "pin"), \
             patch.object(delta, "LEDGER", ledger), patch.object(delta, "inventory", return_value={"source.ts"}), \
             patch.object(delta, "validate_reference", return_value="v0.13.4"), \
             contextlib.redirect_stderr(io.StringIO()), contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(delta.main(), 1)
            ledger.write_text("path\tlayer\treason\nsource.ts\tL0\tUpstream defect fix\n", encoding="utf-8")
            self.assertEqual(delta.main(), 0)
            self.write("app/source.ts", "upstream")
            self.assertEqual(delta.main(), 1)

    def test_wrong_pin_and_dirty_reference_are_failures_not_unavailability(self):
        pin = self.root / "pin"
        pin.mkdir()
        app = self.write("app/package.json", json.dumps({"version": "0.13.4"})).parent
        with patch("upstream_contract.git", return_value="v0.13.3\n"):
            with self.assertRaises(ContractError) as raised:
                validate_reference(pin, app)
            self.assertNotIsInstance(raised.exception, ReferenceUnavailable)
        with patch("upstream_contract.git", side_effect=["v0.13.4\n", "src/changed.ts\n"]):
            with self.assertRaises(ContractError):
                validate_reference(pin, app)
        with self.assertRaises(ReferenceUnavailable):
            validate_reference(self.root / "missing", app)

    def test_full_verifier_uses_disposable_profile_and_cleans_it_on_test_failure(self):
        bin_dir = self.root / "bin"
        # Stub python3 so the documentation gates are skipped, but let the Bun test runner through:
        # fleet-verify runs the suite via scripts/run-bun-tests.py, and this test is about that step.
        python = self.write("bin/python3", f"""#!/bin/sh
case "$1" in *run-bun-tests.py) exec {sys.executable} "$@";; esac
exit 0
""")
        bun = self.write("bin/bun", '''#!/bin/sh
if [ "$1" = test ]; then
  printf '%s' "$CRAFT_CONFIG_DIR" > "$PROFILE_CAPTURE"
  test -d "$CRAFT_CONFIG_DIR" || exit 99
  exit 42
fi
exit 0
''')
        python.chmod(0o755)
        bun.chmod(0o755)
        capture = self.root / "profile-path"
        env = dict(os.environ, PATH=f"{bin_dir}{os.pathsep}{os.environ['PATH']}",
                   CRAFT_CONFIG_DIR="/owner-profile-must-not-be-used", PROFILE_CAPTURE=str(capture))
        result = subprocess.run(["bash", str(SCRIPTS / "fleet-verify.sh")], env=env, capture_output=True, text=True)
        self.assertEqual(result.returncode, 42, result.stderr)
        profile = Path(capture.read_text())
        self.assertIn("fleet-verification-profile.", profile.name)
        self.assertFalse(profile.exists(), "the temporary profile must be removed even when tests fail")
        self.assertIn("disposable", result.stdout)


if __name__ == "__main__":
    unittest.main()
