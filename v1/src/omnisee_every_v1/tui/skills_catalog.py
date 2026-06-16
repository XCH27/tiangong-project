from __future__ import annotations

import json
import os
from pathlib import Path

FALLBACK_SKILLS = ["video-note", "shot-breakdown", "reverse-prompt", "course-outline", "transcript-only", "storyboard", "ad-analysis", "summary", "chapters", "video-note-visual", "video-note-xiaohongshu", "video-note-academic", "video-blog"]
FALLBACK_DEPTHS = {
    "storyboard": "with_frames",
    "shot-breakdown": "with_vlm",
    "reverse-prompt": "with_vlm",
    "course-outline": "with_frames",
    "ad-analysis": "with_vlm",
    "video-note-visual": "with_frames",
    "video-blog": "with_frames",
}

def _from_config() -> Path | None:
    try:
        from omnisee_every.backend import load_config
        p = Path(load_config().get("skills_dir", "")).expanduser()
        if p.is_dir():
            return p
    except Exception:
        pass
    return None

def find_skills_dir() -> Path | None:
    p = _from_config()
    if p:
        return p
    env_dir = os.environ.get("OMNISEE_SKILLS_DIR")
    if env_dir and Path(env_dir).expanduser().is_dir():
        return Path(env_dir).expanduser()
    try:
        dev_dir = Path(__file__).resolve().parents[3] / "MCP-Skill"
        if dev_dir.is_dir():
            return dev_dir
    except Exception:
        pass
    for path_str in ("MCP-Skill", "./MCP-Skill"):
        try:
            cwd_dir = Path(path_str).resolve()
            if cwd_dir.is_dir():
                return cwd_dir
        except Exception:
            pass
    return None

def _parse_schema(schema_path: Path) -> tuple[str, str] | None:
    if not schema_path.is_file():
        return None
    try:
        with open(schema_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        name = data.get("name")
        if name:
            return name, data.get("depth", "text_only")
    except Exception:
        pass
    return None

def _apply_aliases(sd: Path, skills: list[str], depths: dict[str, str]) -> None:
    try:
        import yaml
        aliases_path = sd / "_aliases.yaml"
        if not aliases_path.is_file():
            return
        aliases = yaml.safe_load(aliases_path.read_text(encoding="utf-8")) or {}
        for aname, adef in aliases.items():
            if aname not in skills:
                skills.append(aname)
                if "depth" in adef:
                    depths[aname] = adef["depth"]
                else:
                    core = adef.get("core", aname)
                    depths[aname] = depths.get(core, "text_only")
    except Exception:
        pass

def load_skills_and_depths() -> tuple[list[str], dict[str, str]]:
    fb_map = {s: FALLBACK_DEPTHS.get(s, "text_only") for s in FALLBACK_SKILLS}
    sd = find_skills_dir()
    if not sd:
        return FALLBACK_SKILLS, fb_map
    try:
        skills, depths = [], {}
        for d in sd.iterdir():
            if d.is_dir() and not d.name.startswith((".", "_")):
                res = _parse_schema(d / "schema.json")
                if res:
                    skills.append(res[0])
                    depths[res[0]] = res[1]
                    
        _apply_aliases(sd, skills, depths)
        return (sorted(skills), depths) if skills else (FALLBACK_SKILLS, fb_map)
    except Exception:
        return FALLBACK_SKILLS, fb_map
