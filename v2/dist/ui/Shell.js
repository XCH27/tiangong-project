import { visibleWidth } from "@earendil-works/pi-tui";
import { ansiFg, ansiReset, getTheme } from "../theme/theme.js";
import { DEFAULT_SKILLS, mockRecentTasks } from "../mock/data.js";
import { Rule } from "./Bits.js";
import { renderAssetPreview, renderAssetWorkbench } from "./AssetWorkbench.js";
import { renderCommandSurface } from "./CommandSurface.js";
import { renderFooter } from "./Composer.js";
import { createShellLayout, DEFAULT_SHELL_HEIGHT, row } from "./ShellLayout.js";
import { renderRail } from "./ShellRail.js";
import { renderSessionTimeline } from "./SessionTimeline.js";
export { createShellLayout } from "./ShellLayout.js";
function statusPill(state, text) {
    const t = getTheme(state.theme);
    return `${ansiFg(t.text_l4)}[${text}]${ansiReset}`;
}
function renderHeader(state, layout) {
    const t = getTheme(state.theme);
    const left = `${ansiFg(t.accent)}◈${ansiReset} OmniVerse Vision ${ansiFg(t.text_l4)}V2 Terminal${ansiReset}`;
    const status = [
        statusPill(state, state.stage),
        statusPill(state, state.doctor?.computed_tier ?? "hardware:—"),
        statusPill(state, state.doctor?.ffmpeg_status ?? "ffmpeg:—"),
        statusPill(state, `${t.glyph}${t.name_zh}`),
    ].join(" ");
    return [
        row(left + " ".repeat(Math.max(1, layout.width - visibleWidth(left) - visibleWidth(status))) + status, layout.width),
        Rule({ theme: state.theme, width: layout.width }),
    ];
}
function renderMain(state, layout) {
    if (state.activeScreen === "setup" || state.activeScreen === "protocol")
        return renderCommandSurface(state, layout.main);
    if (state.activeScreen === "chat")
        return renderAssetPreview(state, layout.main);
    return renderSessionTimeline(state, layout.main);
}
function combineBody(state, layout, rail, main, side) {
    const separator = `${ansiFg(getTheme(state.theme).border_subtle)}│${ansiReset}`;
    const lines = [];
    for (let i = 0; i < layout.rail.height; i++) {
        const left = rail[i] ?? "";
        const center = main[i] ?? "";
        if (layout.showSide) {
            const right = side[i] ?? "";
            lines.push(row(left, layout.rail.width) + separator + row(center, layout.main.width) + separator + row(right, layout.side.width));
        }
        else {
            lines.push(row(left, layout.rail.width) + separator + row(center, layout.main.width));
        }
    }
    return lines.map((line) => row(line, layout.width));
}
export function renderShell(state, height = DEFAULT_SHELL_HEIGHT) {
    const layout = createShellLayout(state.width, height);
    const rail = renderRail(state, layout.rail);
    const main = renderMain(state, layout);
    const side = layout.showSide ? renderAssetWorkbench(state, layout.side) : [];
    return [
        ...renderHeader(state, layout),
        ...combineBody(state, layout, rail, main, side),
        ...renderFooter(state, layout),
    ].map((line) => row(line, layout.width));
}
export function renderShellFixture(width, height = DEFAULT_SHELL_HEIGHT) {
    return renderShell({
        theme: "ink-night",
        stage: "done",
        activeScreen: "chat",
        selectedActionIndex: 0,
        width,
        url: "https://www.bilibili.com/video/BV1GJ411x7h7",
        urlInputLine: "https://www.bilibili.com/video/BV1GJ411x7h7",
        chatInputLine: "第 3 分钟出现了什么？",
        composerHint: null,
        config: {
            live: false,
            apiUrl: "http://127.0.0.1:8000",
            exportDir: "tmp/exports",
            offline: false,
            path: "~/.config/omniverse-vision/v2.json",
        },
        chatHistory: [
            { role: "user", text: "这部视频讲了什么？" },
            { role: "assistant", text: "这是一个带时间戳证据的视频分析结果。" },
        ],
        taskRef: {
            task_id: "tsk_mock_fixture",
            source_hash: "src_mock_fixture",
            events_url: "/api/v1/tasks/tsk_mock_fixture/events",
            cancel_url: "/api/v1/tasks/tsk_mock_fixture",
            retry_url: "/api/v1/tasks/tsk_mock_fixture/retry",
        },
        recentTasks: mockRecentTasks(),
        selectedRecentIndex: 0,
        runId: "run_fixture",
        runOutputPath: "tmp/workspace/assets/src_mock_fixture/runs/demo/output.md",
        runResult: {
            run_id: "run_fixture",
            source_hash: "src_mock_fixture",
            metadata: {
                schema_version: 1,
                source_hash: "src_mock_fixture",
                url: "https://www.bilibili.com/video/BV1GJ411x7h7",
                title: "Fixture video",
                duration: 225,
                platform: "bilibili",
                uploader: "fixture",
                upload_date: "2026-06-02",
                language: "zh",
                has_official_subtitles: true,
                subtitle_languages: ["zh"],
                thumbnail_url: "",
                tags: [],
            },
            output_markdown: [
                "# OmniVerse Vision Analysis",
                "",
                "## Key points",
                "- [00:00] Product framing and source context.",
                "- [00:45] Visual theme and multimodal workflow.",
                "- [02:15] Fallback path and asset export.",
                "",
                "## Evidence",
                "Frame refs and transcript spans stay as backend AssetRef/EvidencePack data.",
            ].join("\n"),
            segments: [{ id: "seg_001", start: 0, end: 45, text: "Product framing and source context." }],
            shots: [
                {
                    id: "shot_001",
                    start: 15,
                    key_frame_ts: 15,
                    thumbnail_path: "/api/v1/frame?token=fixture",
                    vlm_description: { type: "visual_reference", content: "Terminal shell frame.", confidence: 0.8, model: "fixture" },
                },
            ],
            options: { skill: "video-note", depth: "with_frames" },
        },
        assetLoadError: null,
        skillName: DEFAULT_SKILLS[0]?.name ?? "note",
        skills: DEFAULT_SKILLS,
        doctor: {
            status: "ok",
            platform: "darwin",
            cpu_architecture: "arm64",
            memory_gb: 16,
            memory_tier: "medium",
            ffmpeg_status: "available",
            acceleration_hints: [],
            computed_tier: "baseline",
            offline_preference: false,
            warnings: [],
        },
        meta: null,
        plan: null,
        progress: 1,
        steps: {
            probe: { step: "probe", status: "completed", message: "ok" },
            export: { step: "export", status: "completed", message: "ok" },
        },
        err: null,
        mascot: "•‿•",
    }, height);
}
