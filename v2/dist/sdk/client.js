/**
 * TypeScript RestTransport client — connects natively to Python REST & SSE endpoints
 * using Node.js built-in fetch and streams.
 */
export class RestTransport {
    baseUrl;
    constructor(baseUrl = "http://127.0.0.1:8000") {
        this.baseUrl = baseUrl.replace(/\/$/, "");
    }
    async probe(url) {
        const res = await fetch(`${this.baseUrl}/api/v1/probe?url=${encodeURIComponent(url)}`);
        if (!res.ok) {
            throw new Error(`Failed to probe metadata: ${res.status} ${res.statusText}`);
        }
        return await res.json();
    }
    async plan(url, skill, depth, metadata) {
        const res = await fetch(`${this.baseUrl}/api/v1/plan`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url, skill, depth, ...(metadata ? { metadata } : {}) }),
        });
        if (!res.ok) {
            throw new Error(`Failed to generate AnalysisPlan: ${res.status} ${res.statusText}`);
        }
        return await res.json();
    }
    async skills() {
        const res = await fetch(`${this.baseUrl}/api/v1/skills`);
        if (!res.ok) {
            throw new Error(`Failed to retrieve skills: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        return data.skills || [];
    }
    async doctor() {
        const res = await fetch(`${this.baseUrl}/api/v1/doctor`);
        if (!res.ok) {
            throw new Error(`Failed to run doctor selfcheck: ${res.status} ${res.statusText}`);
        }
        return await res.json();
    }
    async analyze(req) {
        const { url, ...rest } = req;
        const res = await fetch(`${this.baseUrl}/api/v1/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ source: url, ...rest }),
        });
        if (!res.ok) {
            throw new Error(`Failed to submit analyze task: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        return toTaskRef(data);
    }
    async recentTasks() {
        const res = await fetch(`${this.baseUrl}/api/v1/tasks/recent`);
        if (!res.ok) {
            throw new Error(`Failed to retrieve recent tasks: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        return data.tasks || [];
    }
    async getRunResult(runId) {
        const res = await fetch(`${this.baseUrl}/api/v1/runs/${encodeURIComponent(runId)}`);
        if (!res.ok) {
            throw new Error(`Failed to retrieve run result: ${res.status} ${res.statusText}`);
        }
        return await res.json();
    }
    async chat(req, onChunk) {
        const res = await fetch(`${this.baseUrl}/api/v1/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req),
        });
        if (!res.ok || !res.body) {
            throw new Error(`Failed to ask asset question: ${res.status} ${res.statusText}`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const citationMarker = "[CITATIONS]";
        let answer = "";
        let pending = "";
        let citationMode = false;
        let doneReading = false;
        const emitSafeText = () => {
            if (citationMode)
                return;
            const markerIndex = pending.indexOf(citationMarker);
            if (markerIndex >= 0) {
                const clean = pending.slice(0, markerIndex).trimEnd();
                if (clean) {
                    answer += clean;
                    onChunk?.(clean);
                }
                pending = "";
                citationMode = true;
                return;
            }
            const safeLength = Math.max(0, pending.length - citationMarker.length + 1);
            if (safeLength === 0)
                return;
            const clean = pending.slice(0, safeLength);
            pending = pending.slice(safeLength);
            answer += clean;
            onChunk?.(clean);
        };
        while (!doneReading) {
            const { done, value } = await reader.read();
            doneReading = done;
            if (!value)
                continue;
            const chunk = decoder.decode(value, { stream: !done });
            pending += chunk;
            emitSafeText();
        }
        emitSafeText();
        if (!citationMode && pending) {
            answer += pending;
            onChunk?.(pending);
        }
        return answer.trimEnd();
    }
    async exportRun(req) {
        const res = await fetch(`${this.baseUrl}/api/v1/runs/${encodeURIComponent(req.runId)}/export`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                provider: req.provider,
                title: req.title,
                options: req.options,
            }),
        });
        if (!res.ok) {
            throw new Error(`Failed to export run: ${res.status} ${res.statusText}`);
        }
        return await res.json();
    }
    async cancelTask(taskId) {
        const res = await fetch(`${this.baseUrl}/api/v1/tasks/${encodeURIComponent(taskId)}`, {
            method: "DELETE",
        });
        if (!res.ok) {
            throw new Error(`Failed to cancel task: ${res.status} ${res.statusText}`);
        }
    }
    async retryTask(taskId) {
        const res = await fetch(`${this.baseUrl}/api/v1/tasks/${encodeURIComponent(taskId)}/retry`, {
            method: "POST",
        });
        if (!res.ok) {
            throw new Error(`Failed to retry task: ${res.status} ${res.statusText}`);
        }
        return toTaskRef(await res.json());
    }
    streamEvents(taskId, onEvent) {
        const abortController = new AbortController();
        const url = `${this.baseUrl}/api/v1/tasks/${taskId}/events`;
        let lastEventId = 0;
        let terminalSeen = false;
        (async () => {
            let attempts = 0;
            while (!abortController.signal.aborted && !terminalSeen) {
                try {
                    const response = await fetch(url, {
                        headers: {
                            "Accept": "text/event-stream",
                            ...(lastEventId > 0 ? { "Last-Event-ID": String(lastEventId) } : {}),
                        },
                        signal: abortController.signal,
                    });
                    if (!response.ok || !response.body) {
                        throw new Error(`SSE failed with status: ${response.status}`);
                    }
                    attempts = 0;
                    await this.readEventStream(response, onEvent, (event) => {
                        lastEventId = Math.max(lastEventId, event.id || 0);
                        terminalSeen = event.event === "done" || event.event === "error";
                    });
                }
                catch (err) {
                    if (err.name === "AbortError" || abortController.signal.aborted)
                        return;
                    attempts += 1;
                    if (attempts > 5) {
                        onEvent({
                            id: -1,
                            event: "error",
                            data: {
                                error: {
                                    code: "STEP_FAILED",
                                    step: "sse_stream",
                                    message: err.message || "SSE connection error",
                                    hint: "Ensure the local Python backend server is running.",
                                    retriable: true,
                                    degraded_to: null,
                                },
                            },
                        });
                        return;
                    }
                    await delay(Math.min(1000, 180 * attempts));
                }
            }
        })();
        return () => {
            abortController.abort();
        };
    }
    async readEventStream(response, onEvent, onParsedEvent) {
        if (!response.body)
            return;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let currentId = 0;
        let currentEvent = "message";
        let currentData = "";
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed === "") {
                        if (currentData) {
                            try {
                                const parsed = JSON.parse(currentData);
                                const event = {
                                    id: currentId,
                                    event: currentEvent,
                                    data: parsed,
                                };
                                onParsedEvent(event);
                                onEvent(event);
                            }
                            catch {
                                // Ignore JSON parse errors on partial heartbeats
                            }
                            currentData = "";
                        }
                        continue;
                    }
                    const colonIdx = line.indexOf(":");
                    if (colonIdx === -1)
                        continue;
                    const key = line.slice(0, colonIdx).trim();
                    const val = line.slice(colonIdx + 1).trim();
                    if (key === "id") {
                        currentId = parseInt(val, 10) || 0;
                    }
                    else if (key === "event") {
                        currentEvent = val;
                    }
                    else if (key === "data") {
                        currentData += val;
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export function toTaskRef(data) {
    return {
        task_id: data.task_id,
        source_hash: data.source_hash,
        events_url: `/api/v1/tasks/${data.task_id}/events`,
        cancel_url: `/api/v1/tasks/${data.task_id}`,
        retry_url: `/api/v1/tasks/${data.task_id}/retry`,
    };
}
