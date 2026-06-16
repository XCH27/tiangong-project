export function buildEvidenceSummary(runResult) {
    const segmentLines = runResult.segments.slice(0, 6).map((segment) => {
        const start = formatTime(segment.start);
        const end = formatTime(segment.end);
        return `- ${start}-${end} ${segment.text}`;
    });
    return [
        `证据摘要：${runResult.segments.length} 个文本段，${runResult.shots.length} 个帧引用。`,
        ...segmentLines,
    ].join("\n");
}
export function buildFrameRefs(runResult) {
    const lines = runResult.shots.slice(0, 8).map((shot) => {
        const ts = formatTime(shot.key_frame_ts ?? shot.start);
        const desc = shot.vlm_description?.content ? ` — ${shot.vlm_description.content}` : "";
        return `- ${ts} ${shot.thumbnail_path}${desc}`;
    });
    return ["帧引用：", ...lines].join("\n");
}
function formatTime(seconds) {
    const safe = Math.max(0, Math.floor(seconds));
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
