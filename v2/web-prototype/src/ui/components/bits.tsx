import type { Bucket, Risk } from "../../types/contracts";

export function Chip({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <button className="chip" onClick={onClick}>{children}</button>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <div className="card-title"><span className="bar" />{children}</div>;
}

export function CostBadge({ bucket }: { bucket: Bucket }) {
  const label: Record<Bucket, string> = { free: "免费", low: "低", medium: "中", high: "高" };
  return <span className={`badge ${bucket}`}>{label[bucket]}</span>;
}

export function RiskBadge({ risk }: { risk: Risk }) {
  const label: Record<Risk, string> = { low: "低风险", medium: "中风险", high: "高风险" };
  return <span className={`badge risk-${risk}`}>{label[risk]}</span>;
}

/** Render markdown-ish note text: timestamps [mm:ss] and frame refs ▣ mm:ss become clickable. */
export function NoteMarkdown({ md, onSeek }: { md: string; onSeek: (sec: number) => void }) {
  const lines = md.split("\n");
  const toSec = (mmss: string) => {
    const [m, s] = mmss.split(":").map(Number); return m * 60 + (s || 0);
  };
  const renderInline = (text: string, _key: number) => {
    // split on `[mm:ss]` inside backticks, ▣ mm:ss, **bold**
    const parts = text.split(/(`\[\d{1,2}:\d{2}\]`|▣ \d{1,2}:\d{2}|\*\*[^*]+\*\*)/g);
    return parts.map((p, i) => {
      const tsm = p.match(/`\[(\d{1,2}:\d{2})\]`/);
      if (tsm) return <span key={i} className="ts" onClick={() => onSeek(toSec(tsm[1]))}>{tsm[1]}</span>;
      const fr = p.match(/▣ (\d{1,2}:\d{2})/);
      if (fr) return <span key={i} className="frame-ref" onClick={() => onSeek(toSec(fr[1]))}>▣ {fr[1]} 打开帧</span>;
      const b = p.match(/^\*\*([^*]+)\*\*$/);
      if (b) return <strong key={i}>{b[1]}</strong>;
      return <span key={i}>{p}</span>;
    });
  };
  const out: React.ReactNode[] = [];
  let ul: React.ReactNode[] = [];
  const flush = () => { if (ul.length) { out.push(<ul key={"ul" + out.length}>{ul}</ul>); ul = []; } };
  lines.forEach((ln, i) => {
    if (ln.startsWith("# ")) { flush(); out.push(<h1 key={i}>{renderInline(ln.slice(2), i)}</h1>); }
    else if (ln.startsWith("## ")) { flush(); out.push(<h2 key={i}>{renderInline(ln.slice(3), i)}</h2>); }
    else if (ln.startsWith("> ")) { flush(); out.push(<blockquote key={i}>{renderInline(ln.slice(2), i)}</blockquote>); }
    else if (ln.startsWith("- ")) { ul.push(<li key={i}>{renderInline(ln.slice(2), i)}</li>); }
    else if (ln.trim() === "") { flush(); }
    else { flush(); out.push(<p key={i}>{renderInline(ln, i)}</p>); }
  });
  flush();
  return <div className="note-md">{out}</div>;
}

export function fmtTs(sec: number): string {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
