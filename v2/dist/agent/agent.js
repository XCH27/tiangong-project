import { Agent } from "@earendil-works/pi-agent-core";
import { getModel } from "@earendil-works/pi-ai";
import { allTools } from "./tools.js";
/**
 * Standard System Prompt for the OmniVerse Vision V2 Agent.
 * Ensures the agent understands its purpose as a video perceiver
 * that leverages local REST assets.
 */
export const DEFAULT_SYSTEM_PROMPT = `
You are OmniVerse Vision, a state-of-the-art agentic assistant designed to analyze, summarize, and retrieve semantic details from video assets.
You are running as a native client and have access to powerful local perception tools:
1. "probe_video": Gets essential metadata (duration, platform, uploader, uploader_date, title, languages) for a video. Always probe a URL first to understand the video length and structure before triggering long analyses.
2. "analyze_video": Submits an asynchronous perception task (ASR transcript extraction, keyframe sampling, and optionally VLM scene descriptions) using specific skills ('note', 'extract', 'repurpose', 'visual', 'transcript'). It returns a TaskRef with task_id, source_hash, events_url, and follow-up actions. The TUI watches SSE progress and retrieves assets; do not assume this tool returns a final note inline.
3. "search_database": Allows keyword and semantic hybrid search inside processed video transcripts and indexes to answer conceptual questions or locate exact timestamps.

Guidelines:
- When a user asks you to summarize, explain, or answer questions about a video link, ALWAYS start by calling "probe_video".
- After checking the metadata, trigger "analyze_video" (typically with skill='note' and depth='text_only' unless they explicitly ask for visual frame descriptions, in which case use depth='with_vlm' or 'with_frames'). Tell the user that processing has started and cite the task_id.
- Once the task is done, use assets or query using "search_database" to find exact evidence. Never invent facts while the task is still running.
- Your answers must be structured, professional, and contain precise citations of timestamps (e.g. \`[01:23]\`) whenever possible. Do not invent timestamps.
`.trim();
/**
 * Factory function to construct the OmniVerse Vision Agent.
 */
export function createOmniVerseAgent(config) {
    // 1. Resolve LLM model from pi-ai registry
    let model;
    try {
        model = getModel(config.provider, config.modelId);
    }
    catch (err) {
        throw new Error(`Failed to load model '${config.modelId}' for provider '${config.provider}': ${err.message}`);
    }
    if (!model) {
        throw new Error(`Unsupported model config: provider '${config.provider}', modelId '${config.modelId}'`);
    }
    // 2. Initialize stateful pi agent
    const agent = new Agent({
        initialState: {
            systemPrompt: config.systemPrompt || DEFAULT_SYSTEM_PROMPT,
            model: model,
            thinkingLevel: model.reasoning ? "medium" : "off",
            tools: allTools,
        },
        // Dynamically retrieve API Key during LLM cycles
        getApiKey: (prov) => {
            if (prov === config.provider && config.apiKey) {
                return config.apiKey;
            }
            // Fallback to standard environment variables handled by pi-ai
            return undefined;
        },
        sessionId: config.sessionId || `ovv-session-${Date.now()}`,
        toolExecution: "parallel",
    });
    return agent;
}
