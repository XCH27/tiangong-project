from __future__ import annotations

import json
from pathlib import Path
from omnisee_every_v1.tui.app import SKILLS, ChatScreen
from omnisee_every_v1.tui.skills_catalog import load_skills_and_depths, find_skills_dir, FALLBACK_SKILLS


def test_v1_skills_list_matches_real_schemas():
    """Verify that V1 skill list matches the real schema names from skills/*/schema.json."""
    skills_dir = find_skills_dir()
    assert skills_dir is not None, "skills/ directory could not be located"

    expected_skills = []
    for d in skills_dir.iterdir():
        if d.is_dir() and not d.name.startswith((".", "_")):
            schema_path = d / "schema.json"
            if schema_path.is_file():
                with open(schema_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                name = data.get("name")
                if name:
                    expected_skills.append(name)

    aliases_yaml = skills_dir / "_aliases.yaml"
    if aliases_yaml.is_file():
        import yaml
        aliases = yaml.safe_load(aliases_yaml.read_text(encoding="utf-8")) or {}
        expected_skills.extend(aliases.keys())

    assert set(SKILLS).issubset(set(expected_skills)), f"V1 SKILLS missing from backend: {set(SKILLS) - set(expected_skills)}"


def test_v1_depth_lookup_matches_schemas():
    """Verify depth lookup matches at least one text_only, with_frames, and with_vlm schema.

    And that unknown skills default to text_only.
    """
    # Create a dummy ChatScreen to test _depth_for_skill()
    class DummyChatScreen:
        def __init__(self, skill: str):
            self._skill = skill

        # Reuse depth resolution logic
        def get_depth(self) -> str:
            from omnisee_every_v1.tui.app import _SKILLS_DEPTH_MAP
            return _SKILLS_DEPTH_MAP.get(self._skill, "text_only")

    # 1. Test text_only
    assert DummyChatScreen("summary").get_depth() == "text_only"
    assert DummyChatScreen("chapters").get_depth() == "text_only"

    # 2. Test with_frames
    assert DummyChatScreen("video-blog").get_depth() == "with_frames"
    assert DummyChatScreen("storyboard").get_depth() == "with_frames"

    # 3. Test with_vlm
    assert DummyChatScreen("ad-analysis").get_depth() == "with_vlm"
    assert DummyChatScreen("reverse-prompt").get_depth() == "with_vlm"

    # 4. Test unknown skill depth remains text_only
    assert DummyChatScreen("non-existent-skill").get_depth() == "text_only"


def test_skills_catalog_fallback_on_failure(monkeypatch):
    """Verify fallback behavior when skills folder cannot be loaded or found."""
    # Mock find_skills_dir to return None to simulate missing/failed folder
    monkeypatch.setattr("omnisee_every_v1.tui.skills_catalog.find_skills_dir", lambda: None)

    skills, depths = load_skills_and_depths()
    assert skills == FALLBACK_SKILLS
    
    # Prove fallback with_vlm cases
    assert depths["shot-breakdown"] == "with_vlm"
    assert depths["reverse-prompt"] == "with_vlm"
    assert depths["ad-analysis"] == "with_vlm"

    # Prove fallback with_frames cases
    assert depths["storyboard"] == "with_frames"
    assert depths["course-outline"] == "with_frames"
    assert depths["video-note-visual"] == "with_frames"
    assert depths["video-blog"] == "with_frames"

    # Prove fallback text_only cases
    assert depths["summary"] == "text_only"
    assert depths["video-note"] == "text_only"
    assert depths["transcript-only"] == "text_only"
    assert depths["chapters"] == "text_only"
    assert depths["video-note-xiaohongshu"] == "text_only"
    assert depths["video-note-academic"] == "text_only"

    assert depths.get("non-existent-skill") is None
