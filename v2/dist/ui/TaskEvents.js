import { PIPELINE_STEPS } from "../types/contracts.js";
const EVENT_TO_STEP = {
    probing: { step: "probe", status: "running" },
    subtitle_check: { step: "acquire_subtitle", status: "completed" },
    segmenting: { step: "transcribe", status: "running" },
    extracting_frames: { step: "extract_frames", status: "running" },
    vlm_describing: { step: "vlm_describe", status: "running" },
    generating: { step: "generate", status: "running" },
    exporting: { step: "export", status: "running" },
};
export function applyTaskStepEvent(steps, ev) {
    const map = EVENT_TO_STEP[ev.event];
    if (!map)
        return steps;
    const next = completeRunningSteps(steps);
    const isDegraded = ev.event === "vlm_describing" && (ev.data.message ?? "").includes("降级");
    next[map.step] = {
        step: map.step,
        status: isDegraded ? "degraded" : map.status,
        message: ev.data.message,
    };
    if (ev.event === "subtitle_check" && ev.data.skipping_asr) {
        next.transcribe = {
            step: "transcribe",
            status: "skipped",
            message: "使用官方字幕",
        };
    }
    return next;
}
export function completeTaskSteps(steps) {
    const next = completeRunningSteps(steps);
    next.export = {
        step: "export",
        status: "completed",
        message: "已写出资产",
    };
    return next;
}
function completeRunningSteps(steps) {
    const next = { ...steps };
    for (const step of PIPELINE_STEPS) {
        if (next[step]?.status === "running") {
            next[step] = { ...next[step], status: "completed" };
        }
    }
    return next;
}
