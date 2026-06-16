from __future__ import annotations


def test_bilibili_plan_prefers_official_subtitles():
    from omnisee_every_v1.tui.video_plan import build_analysis_plan_markup

    body = build_analysis_plan_markup(
        "https://www.bilibili.com/video/BV1xx411c7mD",
        skill="video-note",
        depth="text_only",
    )

    assert "视频分析计划" in body
    assert "B站" in body
    assert "官方字幕优先" in body
    assert "跳过 ASR" in body
    assert "probe" in body
    assert "生成笔记" in body
    assert "G1.5" in body


def test_high_risk_social_plan_is_honest_about_fallback():
    from omnisee_every_v1.tui.video_plan import build_analysis_plan_markup

    body = build_analysis_plan_markup(
        "https://www.xiaohongshu.com/explore/abc",
        skill="video-note-xiaohongshu",
        depth="with_frames",
    )

    assert "小红书" in body
    assert "高风控平台" in body
    assert "Clipper/上传" in body
    assert "不承诺裸抓" in body
    assert "锚点帧" in body


def test_local_media_plan_does_not_claim_network_download():
    from omnisee_every_v1.tui.video_plan import build_analysis_plan_markup

    body = build_analysis_plan_markup(
        "/Users/lullwen/Videos/demo.mp4",
        skill="video-note",
        depth="text_only",
    )

    assert "本地媒体" in body
    assert "仅读本地文件" in body
    assert "无平台风控" in body
