"""The inherited launcher must not turn missing implementation into a Bun invocation."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
LAUNCHER = ROOT / 'app/apps/electron/resources/bin/craft-agent'


class CliAvailabilityTests(unittest.TestCase):
    # Upstream v0.13.4's launcher runs Bun on a missing entry file and exits 0 (verified
    # 2026-09-22). Fleet's fix was removed with the original-source reset; restoring it is an L0
    # correction awaiting approval (TODO.md). Remove this decorator when the fix lands — unittest
    # reports an unexpected success until then.
    @unittest.expectedFailure
    def test_missing_entry_fails_and_configured_entry_preserves_arguments(self):
        with tempfile.TemporaryDirectory(prefix='fleet-cli-test-') as directory:
            root = Path(directory)
            runtime = root / 'fake-bun'
            runtime.write_text('#!/bin/sh\nprintf "%s\\n" "$@"\n')
            runtime.chmod(0o700)
            env = {**os.environ, 'CRAFT_BUN': str(runtime), 'CRAFT_CLI_ENTRY': '', 'CRAFT_COMMANDS_ENTRY': ''}
            for entry in ['', str(root / 'missing.ts')]:
                result = subprocess.run(['sh', str(LAUNCHER), '--help'], env={**env, 'CRAFT_COMMANDS_ENTRY': entry}, capture_output=True, text=True)
                self.assertEqual(result.returncode, 69)
                self.assertIn('CRAFT_CLI_UNAVAILABLE', result.stderr)
                self.assertEqual(result.stdout, '')
            entry = root / 'configured entry.ts'
            entry.write_text('// synthetic implementation')
            result = subprocess.run(['sh', str(LAUNCHER), 'label', 'name with spaces'], env={**env, 'CRAFT_COMMANDS_ENTRY': str(entry)}, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0)
            self.assertEqual(result.stdout.splitlines(), ['run', str(entry), 'label', 'name with spaces'])
