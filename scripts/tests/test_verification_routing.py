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
            for name in ("python3", "pnpm", "bun"):
                command = commands / name
                command.write_text(
                    '#!/bin/sh\n'
                    'echo "' + name + ' $*" >> "$FLEET_TEST_COMMAND_LOG"\n'
                    'case "$*" in *check-upstream-delta.py*) '
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
        code, calls = self.run_gate("--candidate-only", fail_preservation=True)
        self.assertEqual(code, 0)
        for check in ("validate-doc-contracts.py", "unittest discover", "check-zcode-candidate.py",
                      "pnpm typecheck", "--if-present run typecheck", "pnpm verify:pre-push"):
            self.assertIn(check, calls)
        self.assertNotIn("check-upstream-delta.py", calls)
        self.assertNotIn("check-orphaned-components.py", calls)
        self.assertNotIn("bun ", calls)

    def test_default_and_retained_modes_still_enforce_preservation_failures(self):
        for mode in (None, "--retained-craft"):
            with self.subTest(mode=mode):
                code, calls = self.run_gate(mode, fail_preservation=True)
                self.assertEqual(code, 7)
                self.assertIn("check-upstream-delta.py", calls)
                self.assertNotIn("pnpm ", calls)
        code, calls = self.run_gate()
        self.assertEqual(code, 0)
        self.assertIn("check-orphaned-components.py", calls)
        self.assertIn("check-zcode-candidate.py", calls)

    def test_misspelled_scope_never_runs_another_branch_silently(self):
        code, calls = self.run_gate("--candidate-onyl")
        self.assertEqual(code, 2)
        self.assertEqual(calls, "")
