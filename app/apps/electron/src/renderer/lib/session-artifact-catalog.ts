export interface HtmlPreviewItemSpec {
  src?: string
  label?: string
  title?: string
}

export interface SessionArtifactSource {
  artifactId: string
  title: string
  src?: string
  html?: string
  messageId: string
}

const HTML_PREVIEW_BLOCK = /```html-preview\s*\n([\s\S]*?)```/g

function parseJsonBlock(raw: string): unknown | null {
  try {
    return JSON.parse(raw.trim())
  } catch {
    return null
  }
}

function normalizeItems(parsed: Record<string, unknown>): HtmlPreviewItemSpec[] {
  if (Array.isArray(parsed.items)) {
    return parsed.items
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item) => ({
        src: typeof item.src === 'string' ? item.src : undefined,
        label: typeof item.label === 'string' ? item.label : undefined,
        title: typeof item.title === 'string' ? item.title : undefined,
      }))
      .filter((item) => !!item.src)
  }

  if (typeof parsed.src === 'string') {
    return [{
      src: parsed.src,
      title: typeof parsed.title === 'string' ? parsed.title : undefined,
      label: typeof parsed.label === 'string' ? parsed.label : undefined,
    }]
  }

  return []
}

export function extractSessionArtifactSources(
  messages: Array<{ id: string; role: string; content: string }>,
): SessionArtifactSource[] {
  const sources: SessionArtifactSource[] = []

  for (const message of messages) {
    if (message.role !== 'assistant' || !message.content) continue

    let itemIndex = 0
    for (const match of message.content.matchAll(HTML_PREVIEW_BLOCK)) {
      const parsed = parseJsonBlock(match[1] ?? '')
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) continue

      const items = normalizeItems(parsed as Record<string, unknown>)
      for (const item of items) {
        if (!item.src) continue
        sources.push({
          artifactId: `artifact-${message.id}-${itemIndex}`,
          title: item.label || item.title || `Artifact ${sources.length + 1}`,
          src: item.src,
          messageId: message.id,
        })
        itemIndex += 1
      }
    }
  }

  return sources
}

export async function loadSessionArtifactHtml(source: SessionArtifactSource): Promise<string> {
  if (source.html) return source.html
  if (!source.src) throw new Error(`Artifact ${source.artifactId} has no html or src`)

  const html = await window.electronAPI.readFile(source.src)
  if (!html.trim()) throw new Error(`Artifact file is empty: ${source.src}`)
  return html
}

export const DEMO_ARTIFACT_SOURCE: SessionArtifactSource = {
  artifactId: 'artifact-demo',
  title: 'Demo editable preview',
  messageId: 'demo',
  html: `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: system-ui, sans-serif; margin: 24px; color: #111; }
      #hero { font-size: 28px; font-weight: 700; margin-bottom: 12px; color: #2563eb; }
      .title { font-size: 16px; color: #444; }
      [data-artifact-selectable] { cursor: crosshair; }
    </style>
  </head>
  <body>
    <div id="hero" data-artifact-selectable>Editable hero</div>
    <p class="title" data-artifact-selectable>Artifact preview subtitle</p>
  </body>
</html>`,
}
