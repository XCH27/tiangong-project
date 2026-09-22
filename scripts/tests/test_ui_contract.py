"""Exercise the restored guard against staged, unstaged and new real renderer files."""
import pathlib
import shutil
import subprocess
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


class UiContractTest(unittest.TestCase):
    def test_diff_scope_and_failure(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            app = root / 'app'
            scripts = app / 'scripts'
            scripts.mkdir(parents=True)
            shutil.copy(ROOT / 'app/scripts/check-ui-contract.ts', scripts)
            renderer = app / 'apps/electron/src/renderer'
            renderer.mkdir(parents=True)
            view = renderer / 'view.tsx'
            view.write_text('export const view = "text-foreground/50"\n')
            def git(*args):
                subprocess.run(['git', *args], cwd=root, check=True, capture_output=True)
            def guard():
                return subprocess.run(['bun', 'scripts/check-ui-contract.ts'], cwd=app,
                                      capture_output=True, text=True)
            git('init', '-q')
            git('add', '.')
            git('-c', 'user.name=Guard Test', '-c', 'user.email=guard@example.invalid',
                'commit', '-qm', 'fixture')
            self.assertEqual(guard().returncode, 0)
            view.write_text('export const view = "bg-red-500"\n')
            self.assertIn('raw Tailwind palette', guard().stderr)
            git('add', '.')
            self.assertNotEqual(guard().returncode, 0)
            view.write_text('export const view = "text-foreground/50"\n')
            git('add', '.')
            new_view = renderer / 'new.tsx'
            new_view.write_text('export const view = "text-foreground/15 shadow-[0_0_1px_red]"\n')
            result = guard()
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('outside the opacity ladder', result.stderr)
            self.assertIn('shared elevation tokens', result.stderr)
            new_view.write_text('export const view = "text-foreground/60 shadow-minimal"\n')
            self.assertEqual(guard().returncode, 0)
