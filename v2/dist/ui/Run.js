import { getTheme, SEMANTIC, ansiFg, ansiReset } from "../theme/theme.js";
import { CardTitle, ProgressBar } from "./Bits.js";
import { PIPELINE_STEPS } from "../types/contracts.js";
const STEP_LABEL = {
    probe: "探测元数据",
    acquire_subtitle: "字幕 / ASR",
    transcribe: "分段",
    extract_frames: "抽取关键帧",
    vlm_describe: "VLM 描述",
    generate: "生成笔记",
    export: "导出资产",
};
const ICON = {
    completed: "✓",
    skipped: "⏭",
    degraded: "▽",
    running: "▸",
    failed: "✗",
    pending: "·",
};
export function renderRunState({ theme, progress, steps, width, }) {
    const t = getTheme(theme);
    const colorFor = (st) => {
        const status = st;
        return status === "completed" ? t.success
            : status === "skipped" ? t.text_l4
                : status === "degraded" ? SEMANTIC.degrade
                    : status === "running" ? SEMANTIC.progress
                        : status === "failed" ? t.error
                            : t.text_l4;
    };
    const lines = [];
    const bar = ProgressBar({ frac: progress, width: 24 });
    lines.push(`${CardTitle({ theme, glyph: "◐", text: "正在分析　" })}${bar}`);
    lines.push("");
    for (const s of PIPELINE_STEPS) {
        const st = steps[s] ?? { step: s, status: "pending" };
        const c = colorFor(st.status);
        const stepLabel = STEP_LABEL[s] || s;
        const paddedLabel = stepLabel.padEnd(14);
        const msg = st.message ?? (st.status === "pending" ? "等待中…" : "");
        lines.push(`  ${ansiFg(t.accent)}┃ ${ansiFg(c)}${ICON[st.status]} ${ansiFg(st.status === "pending" ? t.text_l4 : t.text_l1)}${paddedLabel}${ansiFg(t.text_l3)}${msg}${ansiReset}`);
    }
    return lines;
}
export function renderFallbackState({ theme, err, width, }) {
    const t = getTheme(theme);
    const lines = [];
    lines.push(`${ansiFg(t.error)}\x1b[1m✗ 未能完成 · 有明确下一步${ansiReset}          ${ansiFg(t.text_l4)}${err.code} · ${err.step}${ansiReset}`);
    lines.push("");
    lines.push(`  ${ansiFg(t.accent)}┃ ${ansiFg(t.text_l1)}${err.message}${ansiReset}`);
    lines.push(`  ${ansiFg(t.accent)}┃ ${ansiFg(t.text_l3)}建议：${err.hint}${ansiReset}`);
    return lines;
}
