"""Candidate source protection must detect lost declarations without changing the user's index."""
import importlib.util
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location(
    "zcode_gate", Path(__file__).resolve().parents[1] / "check-zcode-candidate.py"
)
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class CandidateGateTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="fleet-candidate-gate-test-")
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.repo = self.root / "candidate"
        self.patches = self.root / "patches"
        self.patches.mkdir()
        subprocess.run(["git", "init", "-q", str(self.repo)], check=True)
        (self.repo / "original.txt").write_text("original\n")
        self.git("add", "original.txt")
        self.git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid",
                 "commit", "-qm", "Fixture base")
        self.base = self.git("rev-parse", "HEAD").strip()
        base_patch = patch.object(gate, "BASE", self.base)
        base_patch.start()
        self.addCleanup(base_patch.stop)
        (self.repo / "original.txt").write_text("declared correction\n")
        self.name = "0001-correction.patch"
        (self.patches / self.name).write_bytes(self.git("diff", "--binary", binary=True))
        self.readme([self.name])

    def git(self, *args, binary=False):
        return subprocess.check_output(["git", "-C", str(self.repo), *args], text=not binary)

    def readme(self, names):
        (self.patches / "README.md").write_text("\n".join(
            f"| {name[:4]} | [{name}]({name}) | reason |" for name in names
        ) + "\n")

    def test_exact_recipe_preserves_unrelated_staged_index(self):
        (self.repo / "staged.txt").write_text("staged\n")
        self.git("add", "staged.txt")
        before = (self.repo / ".git/index").read_bytes()
        # An incomplete working tree cannot pass, even if the normal index happens to be staged.
        with self.assertRaisesRegex(ValueError, "undeclared source"):
            gate.verify(self.repo, self.patches)
        self.assertEqual((self.repo / ".git/index").read_bytes(), before)
        (self.repo / "staged.txt").unlink()
        count, tree = gate.verify(self.repo, self.patches)
        self.assertEqual(count, 1)
        self.assertNotEqual(tree, self.git("rev-parse", "HEAD^{tree}").strip())
        self.assertEqual((self.repo / ".git/index").read_bytes(), before)

    def test_untracked_source_cannot_escape_the_gate(self):
        (self.repo / "new-source.ts").write_text("export const missing = true\n")
        with self.assertRaisesRegex(ValueError, "undeclared source"):
            gate.verify(self.repo, self.patches)
        # Recipe-only proves reconstruction, never correspondence with current work.
        self.assertEqual(gate.verify(self.repo, self.patches, compare_working=False)[0], 1)

    def test_undeclared_removal_fails(self):
        (self.repo / "original.txt").unlink()
        with self.assertRaisesRegex(ValueError, "undeclared source"):
            gate.verify(self.repo, self.patches)

    def test_number_gap_and_missing_table_row_fail_before_replay(self):
        renamed = "0002-correction.patch"
        (self.patches / self.name).rename(self.patches / renamed)
        self.readme([renamed])
        with self.assertRaisesRegex(ValueError, "consecutively"):
            gate.verify(self.repo, self.patches)
        (self.patches / renamed).rename(self.patches / self.name)
        self.readme([])
        with self.assertRaisesRegex(ValueError, "table"):
            gate.verify(self.repo, self.patches)

    def test_non_applicable_patch_does_not_mutate_index(self):
        before = (self.repo / ".git/index").read_bytes()
        original = (self.patches / self.name).read_text()
        (self.patches / self.name).write_text(original.replace("-original", "-not-the-base"))
        with self.assertRaises(subprocess.CalledProcessError):
            gate.verify(self.repo, self.patches)
        self.assertEqual((self.repo / ".git/index").read_bytes(), before)

    def test_reconstructs_fresh_checkout_and_refuses_a_second_application(self):
        (self.repo / "original.txt").write_text("original\n")
        before = (self.repo / ".git/index").read_bytes()
        count, tree = gate.reconstruct(self.repo, self.patches)
        self.assertEqual(count, 1)
        self.assertEqual((self.repo / "original.txt").read_text(), "declared correction\n")
        self.assertEqual(gate.verify(self.repo, self.patches), (count, tree))
        self.assertEqual((self.repo / ".git/index").read_bytes(), before)
        with self.assertRaisesRegex(ValueError, "changes or local files"):
            gate.reconstruct(self.repo, self.patches)

    def test_reconstruction_rejects_tracked_untracked_and_ignored_local_work(self):
        for kind in ("tracked", "untracked", "ignored"):
            with self.subTest(kind=kind):
                (self.repo / "original.txt").write_text("original\n")
                if kind == "tracked":
                    target = self.repo / "original.txt"
                    target.write_text("owner work\n")
                else:
                    target = self.repo / "profile.txt"
                    target.write_text("owner data\n")
                    if kind == "ignored":
                        (self.repo / ".git/info/exclude").write_text("profile.txt\n")
                contents = target.read_bytes()
                with self.assertRaisesRegex(ValueError, "changes or local files"):
                    gate.reconstruct(self.repo, self.patches)
                self.assertEqual(target.read_bytes(), contents)
                if kind != "tracked":
                    target.unlink()

    def test_reconstruction_rejects_another_base_before_mutating(self):
        (self.repo / "original.txt").write_text("original\n")
        with patch.object(gate, "BASE", "0" * 40):
            with self.assertRaisesRegex(ValueError, "exact ZCode base"):
                gate.reconstruct(self.repo, self.patches)
        self.assertEqual((self.repo / "original.txt").read_text(), "original\n")

    def test_reconstruction_preflights_all_patches_before_applying_the_first(self):
        (self.repo / "original.txt").write_text("original\n")
        invalid = "0002-invalid.patch"
        (self.patches / invalid).write_text(
            (self.patches / self.name).read_text().replace("-original", "-absent")
        )
        self.readme([self.name, invalid])
        before = (self.repo / ".git/index").read_bytes()
        with self.assertRaises(subprocess.CalledProcessError):
            gate.reconstruct(self.repo, self.patches)
        self.assertEqual((self.repo / "original.txt").read_text(), "original\n")
        self.assertEqual((self.repo / ".git/index").read_bytes(), before)


if __name__ == "__main__":
    unittest.main()
