import { useState } from "react";
import type { RunResult, ChatAnswer } from "../../types/contracts";
import { CardTitle, NoteMarkdown, fmtTs } from "../components/bits";

export function AssetView({ result, onAsk, onExport, onSeek }: {
  result: RunResult;
  onAsk: (q: string) => Promise<ChatAnswer>;
  onExport: () => void;
  onSeek: (sec: number) => void;
}) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<ChatAnswer | null>(null);
  const [asking, setAsking] = useState(false);

  const ask = async () => {
    if (!q.trim()) return;
    setAsking(true);
    try { setAnswer(await onAsk(q)); } finally { setAsking(false); }
  };

  return (
    <div className="asset-split">
      <div className="card">
        <CardTitle>图文笔记 <span className="mock-tag">runs/&#123;id&#125;/output.md</span></CardTitle>
        <NoteMarkdown md={result.output_markdown} onSeek={onSeek} />
        <div className="actions">
          <button className="btn" onClick={onExport}>导出到 Obsidian</button>
          <button className="btn ghost" disabled>导出 Markdown</button>
        </div>
      </div>

      <div>
        <div className="card evidence">
          <CardTitle>证据 / 片段</CardTitle>
          {result.shots.map((sh) => (
            <div key={sh.id} className="seg" style={{ borderLeft: "3px solid var(--sem-plan)" }}>
              <div className="seg-ts">▣ {fmtTs(sh.key_frame_ts)} · 关键帧（VLM hypothesis · {Math.round(sh.vlm_description.confidence * 100)}%）</div>
              <div className="seg-tx">{sh.vlm_description.content}</div>
            </div>
          ))}
          {result.segments.map((sg) => (
            <div key={sg.id} className="seg" onClick={() => onSeek(sg.start)} style={{ cursor: "pointer" }}>
              <div className="seg-ts">{fmtTs(sg.start)}</div>
              <div className="seg-tx">{sg.text}</div>
            </div>
          ))}
        </div>

        <div className="card qa-box">
          <CardTitle>问视频 · 答案带出处 <span className="mock-tag">POST /api/v1/chat</span></CardTitle>
          <div className="qa-input">
            <input value={q} placeholder="例如：QKV 分别是什么？"
              onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} />
            <button className="btn sm" onClick={ask} disabled={asking}>{asking ? "…" : "问"}</button>
          </div>
          {answer && (
            <div className="qa-answer">
              {answer.answer}
              <div className="qa-cite">
                {answer.citations.map((c) => (
                  <span key={c.segment_id} className="ts" onClick={() => onSeek(c.ts)}>{fmtTs(c.ts)}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
