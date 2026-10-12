"""Execute the verification router with recording commands, without loading user runtimes."""
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


class VerificationRoutingTests(unittest.TestCase):
    def run_gate(self, mode=None, fail_preservation=False):
        with tempfile.TemporaryDirectory(prefix="fleet-verification-routing-") as temporary:
            root = Path(temporary)
            (root / "scripts").mkdir()
            (root / ".fleet/zcode").mkdir(parents=True)
            (root / "app").mkdir()
            script = root / "scripts/fleet-verify.sh"
            shutil.copy2(Path(__file__).resolve().parents[1] / "fleet-verify.sh", script)
            commands = root / "commands"
            commands.mkdir()
            log = root / "calls.log"
            for name in ("python3", "node", "pnpm", "bun"):
                command = commands / name
                command.write_text(
                    '#!/bin/sh\n'
                    'echo "' + name + ' $*" >> "$FLEET_TEST_COMMAND_LOG"\n'
                    'case "$*" in *typecheck*) '
                    '[ "$FLEET_TEST_FAIL_PRESERVATION" = "1" ] && exit 7 ;; esac\n'
                    'exit 0\n'
                )
                command.chmod(0o755)
            env = {**os.environ, "PATH": str(commands) + os.pathsep + os.environ["PATH"],
                   "FLEET_TEST_COMMAND_LOG": str(log),
                   "FLEET_TEST_FAIL_PRESERVATION": "1" if fail_preservation else "0"}
            result = subprocess.run(["bash", str(script)] + ([mode] if mode else []),
                                    cwd=root, env=env, text=True, capture_output=True, timeout=10)
            return result.returncode, log.read_text() if log.exists() else ""

    def test_candidate_ci_keeps_shared_and_candidate_gates_without_selecting_retained_work(self):
        code, calls = self.run_gate("--candidate-only")
        self.assertEqual(code, 0)
        for check in ("unittest discover", "check-zcode-candidate.py", "desktop-vite-config.test.mjs",
                      "pnpm typecheck", "--if-present run typecheck", "pnpm verify:pre-push"):
            self.assertIn(check, calls)
        self.assertNotIn("check-upstream-delta.py", calls)
        self.assertNotIn("check-orphaned-components.py", calls)
        self.assertNotIn("bun ", calls)

    def test_default_targets_zcode_and_requires_builds(self):
        code, calls = self.run_gate()
        self.assertEqual(code, 0)
        self.assertNotIn("bun ", calls)
        self.assertIn("check-zcode-candidate.py", calls)
        self.assertIn("build-desktop-agent-cli.mjs", calls)
        self.assertIn("@zcode/desktop build:no-runtime-assets", calls)
        self.assertIn("pnpm lint:cli", calls)
        self.assertLess(calls.index("build-desktop-agent-cli.mjs"), calls.index("pnpm lint:cli"))
        self.assertLess(calls.index("test:staged-agent-recovery"), calls.index("pnpm lint:cli"))

    def test_type_failure_stops_the_gate(self):
        code, calls = self.run_gate(fail_preservation=True)
        self.assertEqual(code, 7)
        self.assertNotIn("verify:pre-push", calls)
        self.assertNotIn("@zcode/desktop build:no-runtime-assets", calls)

    def test_retained_craft_requires_explicit_selection(self):
        code, calls = self.run_gate("--retained-craft")
        self.assertEqual(code, 0)
        self.assertIn("bun run validate:fleet", calls)
        self.assertNotIn("check-zcode-candidate.py", calls)
        self.assertNotIn("pnpm ", calls)

    def test_misspelled_scope_never_runs_another_branch_silently(self):
        code, calls = self.run_gate("--candidate-onyl")
        self.assertEqual(code, 2)
        self.assertEqual(calls, "")
