import { client } from "../api/client.js";
import { Type } from "@sinclair/typebox";
/**
 * Tool 1: probe_video
 * Probes a video URL for metadata (duration, title, platform, etc.)
 */
export const probeVideoTool = {
    name: "probe_video",
    description: "Get metadata for a video URL (e.g. platform, duration, title, uploader, official subtitles availability). Use this first before triggering long analyses.",
    label: "Probe Video",
    parameters: Type.Object({
        url: Type.String({ description: "The URL of the video (bilibili, youtube, or local file path)." }),
    }),
    async execute(toolCallId, params, signal) {
        const { url } = params;
        const { data, error } = await client.GET("/api/v1/probe", {
            params: { query: { url } },
            signal,
        });
        if (error) {
            throw new Error(`Failed to probe video: ${JSON.stringify(error)}`);
        }
        return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
            details: data,
        };
    },
};
/**
 * Tool 2: analyze_video
 * Triggers video analysis using a specific skill and depth.
 * Returns a TaskRef and leaves progress/asset retrieval to the V2 TUI or host.
 */
export const analyzeVideoTool = {
    name: "analyze_video",
    description: "Submit an asynchronous OmniVerse analysis task for a video URL. Returns a TaskRef with task_id, source_hash, events_url, cancel_url, and retry_url. The host or TUI must watch SSE progress and retrieve assets after completion; this tool never returns the full Markdown or frame payload inline.",
    label: "Analyze Video",
    parameters: Type.Object({
        url: Type.String({ description: "The URL of the video to analyze." }),
        skill: Type.String({
            description: "The analysis skill to apply. Choices: 'note' (summary notes), 'extract' (outline), 'repurpose' (script adaptation), 'visual' (scene descriptions), 'transcript' (raw text). Default: 'note'.",
            default: "note"
        }),
        depth: Type.Union([
            Type.Literal("text_only"),
            Type.Literal("with_frames"),
            Type.Literal("with_vlm")
        ], {
            description: "Processing depth. 'text_only' (fast, transcript only); 'with_frames' (transcript + keyframes); 'with_vlm' (transcript + keyframes + VLM descriptions). Default: 'text_only'.",
            default: "text_only"
        }),
    }),
    async execute(toolCallId, params, signal) {
        const { url, skill, depth } = params;
        const { data: responseData, error } = await client.POST("/api/v1/analyze", {
            body: { source: url, skill, depth },
            signal,
        });
        if (error) {
            throw new Error(`Failed to trigger analysis: ${JSON.stringify(error)}`);
        }
        const rawTask = taskRefLike(responseData);
        const taskId = taskRefString(rawTask.task_id);
        if (!taskId) {
            throw new Error("Analysis request failed to return a valid task_id.");
        }
        const taskRef = {
            task_id: taskId,
            source_hash: taskRefString(rawTask.source_hash),
            events_url: `/api/v1/tasks/${taskId}/events`,
            cancel_url: `/api/v1/tasks/${taskId}`,
            retry_url: `/api/v1/tasks/${taskId}/retry`,
            next_actions: [
                "watch_sse_events",
                "retrieve_asset_manifest_after_done",
                "query_search_database_for_cited_evidence",
            ],
        };
        return {
            content: [{
                    type: "text",
                    text: [
                        `Task submitted: ${taskRef.task_id}`,
                        `Events: ${taskRef.events_url}`,
                        "Do not answer from video content until the task reaches done and assets/evidence are available.",
                    ].join("\n"),
                }],
            details: taskRef,
        };
    },
};
function taskRefLike(value) {
    return value && typeof value === "object" ? value : {};
}
function taskRefString(value) {
    return typeof value === "string" ? value : "";
}
/**
 * Tool 3: search_database
 * Performs Hybrid search (FTS + Vector embedding matching) on processed video indexes.
 */
export const searchDatabaseTool = {
    name: "search_database",
    description: "Search in-video transcripts and narrative structures for query keywords or semantic concepts. Excellent for locating specific moments, quotes, or topics.",
    label: "Search Database",
    parameters: Type.Object({
        q: Type.String({ description: "The search query (keywords, phrases, or conceptual question)." }),
        source_hash: Type.Optional(Type.String({ description: "Optionally scope search to a single video source hash." })),
        top_k: Type.Optional(Type.Integer({ description: "Maximum search results to return. Default: 5.", default: 5 })),
    }),
    async execute(toolCallId, params, signal) {
        const { q, source_hash, top_k } = params;
        const { data, error } = await client.GET("/api/v1/search", {
            params: {
                query: {
                    q,
                    ...(source_hash ? { source_hash } : {}),
                    ...(top_k ? { top_k } : {}),
                },
            },
            signal,
        });
        if (error) {
            throw new Error(`Failed to query database search: ${JSON.stringify(error)}`);
        }
        return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
            details: data,
        };
    },
};
/**
 * Export all tools as a collection
 */
export const allTools = [
    probeVideoTool,
    analyzeVideoTool,
    searchDatabaseTool,
];
