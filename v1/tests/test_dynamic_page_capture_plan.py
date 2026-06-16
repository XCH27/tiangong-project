from __future__ import annotations

import json
from pathlib import Path

from typer.testing import CliRunner

from omnisee_backend.capture.dynamic_page import plan_dynamic_page_capture
from omnisee_every.cli.ov import app


def test_dynamic_capture_plan_low_memory_has_bounded_cost(tmp_path):
    workspace = tmp_path / "workspace"

    result = plan_dynamic_page_capture(
        "https://fellou.ai/",
        mode="full",
        hardware_profile={"memory_gb": 8.0, "memory_tier": "low"},
        config={"workspace_dir": str(workspace)},
    )

    assert result["ok"] is True
    assert result["schema_version"] == "omniverse.dynamic_page_capture_plan.v1"
    assert result["budget"]["max_parallel_pages"] == 1
    assert result["budget"]["max_recording_seconds"] == 0
    assert result["budget"]["max_long_slices"] <= 6
    assert result["budget"]["max_total_images"] <= 12
    assert result["stability_policy"]["no_unbounded_scroll"] is True
    assert result["stability_policy"]["no_unbounded_recording"] is True
    assert Path(result["manifest_path"]).is_relative_to(workspace / "ui_captures")
    manifest = json.loads(Path(result["manifest_path"]).read_text(encoding="utf-8"))
    assert manifest["capture_plan"]["recording"]["enabled"] is False
    assert "single_viewport_screenshot" in manifest["capture_plan"]["capture_modes"]
    assert "full_page_long_screenshot" in manifest["capture_plan"]["capture_modes"]
    assert "vlm_ready_long_screenshot_tiles" in manifest["capture_plan"]["capture_modes"]
    assert "recording_disabled_by_budget" in manifest["capture_plan"]["capture_modes"]
    assert manifest["capture_plan"]["long_page_slices"]["aspect_ratio"] == "16:9"
    assert manifest["capture_plan"]["long_page_slices"]["max_slices"] <= result["budget"]["max_total_images"]
    assert "does_not_capture_animation_timing" in manifest["capture_plan"]["long_page_slices"]["limitations"]
    assert manifest["capture_plan"]["scroll_sections"]["step_ratio_of_viewport"] == 0.8
    assert manifest["capture_plan"]["scroll_sections"]["wait_after_scroll_ms"] == 2500
    assert "animation_settle_best_effort" in manifest["capture_plan"]["scroll_sections"]["wait_until"]
    assert manifest["capture_plan"]["vlm_preprocessing"]["never_send_unsliced_full_page_to_vlm"] is True
    assert manifest["capture_plan"]["vlm_preprocessing"]["ocr_first_for_text_dense_tiles"] is True
    assert manifest["capture_plan"]["interaction_protocol"]["dismiss_known_overlays_first"] is True
    assert manifest["capture_plan"]["interaction_protocol"]["overlay_dismissal_strategy"] == "semantic_locator_first_then_coordinate_fallback"
    assert manifest["capture_plan"]["interaction_protocol"]["scroll_then_wait_before_screenshot"] is True
    overlay_preflight = manifest["capture_plan"]["overlay_preflight"]
    assert overlay_preflight["enabled"] is True
    assert overlay_preflight["scope"] == "third_party_webpages_before_any_screenshot_or_recording"
    assert overlay_preflight["max_actions"] == 3
    assert "Necessary Cookies Only" in overlay_preflight["dismissal_order"][0]["prefer_text"]
    assert "Accept All Cookies" in overlay_preflight["dismissal_order"][0]["fallback_text"]
    assert overlay_preflight["dismissal_order"][0]["rule"] == "prefer_privacy_preserving_choice_before_accept_all"
    assert any(order["kind"] == "opening_ad_or_splash_screen" for order in overlay_preflight["dismissal_order"])
    login_prompt = next(order for order in overlay_preflight["dismissal_order"] if order["kind"] == "login_or_signup_prompt")
    assert "Continue as guest" in login_prompt["prefer_text"]
    assert login_prompt["rule"] == "dismiss_only_if_close_guest_or_skip_choice_exists_never_enter_credentials"
    assert "visual_coordinate_fallback_after_screenshot" in overlay_preflight["locator_strategy"]
    assert "[role='dialog']" in overlay_preflight["known_overlay_selectors"]
    assert "captcha" in overlay_preflight["do_not_bypass"]
    assert "hard_login_wall_without_close_guest_or_skip" in overlay_preflight["do_not_bypass"]
    assert "credential_entry_required" in overlay_preflight["do_not_bypass"]
    assert overlay_preflight["verification"]["capture_before_after"] is True
    assert overlay_preflight["verification"]["record_clicked_text_selector_or_coordinates"] is True
    assert overlay_preflight["human_escalation"]["enabled"] is True
    assert "overlay_matches_do_not_bypass" in overlay_preflight["human_escalation"]["trigger_when"]
    assert (
        overlay_preflight["human_escalation"]["required_user_action"]
        == "ask_user_to_dismiss_or_confirm_in_browser_then_resume_capture"
    )
    assert overlay_preflight["human_escalation"]["resume_strategy"] == "reuse_same_browser_context_and_continue_from_overlay_preflight"
    assert "copy_full_page_screenshot_to_desktop" in manifest["after_capture_actions"]["optional_user_requested"]
    assert "exports_are_copies_not_primary_assets" in manifest["after_capture_actions"]["rules"]
    evidence_pack = json.loads(Path(result["ui_evidence_pack_path"]).read_text(encoding="utf-8"))
    assert evidence_pack["state"] == "planned"
    assert evidence_pack["required_user_action"] == "execute_dynamic_capture_plan"


def test_dynamic_capture_plan_high_memory_allows_bounded_recording(tmp_path):
    result = plan_dynamic_page_capture(
        "https://fellou.ai/",
        mode="balanced",
        hardware_profile={"memory_gb": 32.0, "memory_tier": "high"},
        config={"workspace_dir": str(tmp_path)},
    )

    assert result["ok"] is True
    assert result["budget"]["max_recording_seconds"] > 0
    assert result["budget"]["max_recording_seconds"] <= 8
    assert result["budget"]["max_total_bytes"] <= 128 * 1024 * 1024
    assert result["capture_plan"]["long_page_slices"]["enabled"] is True
    assert result["capture_plan"]["long_page_slices"]["max_slices"] <= 12
    assert "scroll_state_sequence" in result["capture_plan"]["capture_modes"]
    assert "optional_short_recording" in result["capture_plan"]["capture_modes"]
    assert result["capture_plan"]["vlm_preprocessing"]["tile_aspect_ratio"] == "16:9"
    assert result["capture_plan"]["vlm_preprocessing"]["max_tile_long_side_px"] == 1600
    assert result["capture_plan"]["recording"]["default_delivery"] == "scroll_state_sequence"
    assert result["capture_plan"]["recording"]["sample_strategy"] == "reuse_video_frame_extractor_for_webm_recording"
    assert "do_not_extract_keyframes_from_scroll_state_sequence" in result["capture_plan"]["recording"]["dedupe_rule"]
    assert result["capture_plan"]["overlay_preflight"]["after_action_wait_ms"] == 1000
    assert "age_verification" in result["capture_plan"]["overlay_preflight"]["do_not_bypass"]
    assert result["capture_plan"]["overlay_preflight"]["human_escalation"]["record_in_manifest"] is True
    assert len(result["capture_plan"]["viewports"]) <= 4


def test_dynamic_capture_plan_rejects_output_dir_outside_ui_captures(tmp_path):
    result = plan_dynamic_page_capture(
        "https://example.com",
        output_dir=tmp_path / "outside",
        config={"workspace_dir": str(tmp_path / "workspace")},
    )

    assert result["ok"] is False
    assert "output_dir must stay under" in result["error"]


def test_ov_capture_dynamic_page_uses_backend_facade(monkeypatch):
    calls: dict[str, object] = {}

    def fake_plan(source, *, mode, output_dir, hardware_profile):
        calls["source"] = source
        calls["mode"] = mode
        calls["output_dir"] = output_dir
        calls["hardware_profile"] = hardware_profile
        return {
            "ok": True,
            "schema_version": "omniverse.dynamic_page_capture_plan.v1",
            "mode": mode,
            "output_dir": "/workspace/ui_captures/dynamic/run",
            "manifest_path": "/workspace/ui_captures/dynamic/run/dynamic_capture_manifest.json",
            "budget": {"max_total_images": 8, "max_total_bytes": 1024, "max_recording_seconds": 0, "estimated_peak_memory_mb": 384},
        }

    monkeypatch.setattr("omnisee_every.backend.plan_dynamic_page_capture_for_frontend", fake_plan)

    runner = CliRunner()
    result = runner.invoke(
        app,
        [
            "capture",
            "dynamic-page",
            "https://fellou.ai/",
            "--mode",
            "fast",
            "--memory-gb",
            "8",
            "--memory-tier",
            "low",
            "--json",
        ],
    )

    assert result.exit_code == 0
    payload = json.loads(result.stdout)
    assert payload["schema_version"] == "omniverse.dynamic_page_capture_plan.v1"
    assert calls == {
        "source": "https://fellou.ai/",
        "mode": "fast",
        "output_dir": None,
        "hardware_profile": {"memory_gb": 8.0, "memory_tier": "low"},
    }
