export interface SSEEvent {
  id?: string;
  event?: string;
  data: string;
}

/**
 * AsyncGenerator that yields parsed Server-Sent Events from a Response.
 */
export async function* fetchServerSentEvents(
  url: string,
  options?: RequestInit
): AsyncGenerator<SSEEvent, void, unknown> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      Accept: 'text/event-stream',
    },
  });

  if (!response.ok || !response.body) {
    throw new Error(`Failed to connect to SSE stream at ${url}: ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let doubleNewlineIndex;
      while ((doubleNewlineIndex = buffer.indexOf('\n\n')) !== -1) {
        const chunk = buffer.slice(0, doubleNewlineIndex);
        buffer = buffer.slice(doubleNewlineIndex + 2);

        const lines = chunk.split('\n');
        const event: SSEEvent = { data: '' };
        let dataLines: string[] = [];

        for (const line of lines) {
          if (line.startsWith('id:')) {
            event.id = line.slice(3).trim();
          } else if (line.startsWith('event:')) {
            event.event = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trim());
          }
        }

        if (dataLines.length > 0) {
          event.data = dataLines.join('\n');
          yield event;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Helper specifically for tasks/{id}/events
 */
export async function* tailTaskEvents(taskId: string, baseUrl = 'http://localhost:8000/api/v1') {
  const url = `${baseUrl}/tasks/${taskId}/events`;
  for await (const sse of fetchServerSentEvents(url)) {
    if (sse.data) {
      try {
        const parsed = JSON.parse(sse.data);
        yield { event: sse.event, data: parsed };
      } catch (e) {
        yield { event: sse.event, data: sse.data };
      }
    }
  }
}
