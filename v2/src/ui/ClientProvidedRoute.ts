import { createHash } from "node:crypto";
import * as path from "node:path";
import { detectPlatform } from "../mock/data.js";
import type { AnalysisPlan, Depth, VideoMetadata } from "../types/contracts.js";

export function clientProvidedDepth(_requestedDepth: Depth): Depth {
  return "text_only";
}

export function buildClientProvidedMetadata(source: string, providedPath: string): VideoMetadata {
  const sourceHash = createHash("sha256")
    .update(`client_provided:${source}:${providedPath}`)
    .digest("hex")
    .slice(0, 16);
  const filename = path.basename(providedPath);
  return {
    schema_version: 1,
    source_hash: sourceHash,
    url: source,
    title: `Client-provided subtitle · ${filename}`,
    duration: 0,
    platform: detectPlatform(source),
    uploader: "client-provided",
    upload_date: "",
    language: "unknown",
    has_official_subtitles: true,
    subtitle_languages: ["unknown"],
    thumbnail_url: "",
    tags: ["client_provided", "subtitle_first"],
  };
}

export function markClientProvidedPlan(plan: AnalysisPlan): AnalysisPlan {
  const skipped = new Set([...plan.skipped_steps, "remote_probe", "download_video", "transcribe"]);
  const warnings = new Set([
    ...plan.user_visible_warnings,
    "已使用本地 handoff/subtitle 输入：跳过远程 probe、下载和 ASR，避免平台风控。",
  ]);
  return {
    ...plan,
    chosen_depth: "text_only",
    skipped_steps: [...skipped],
    expected_fallback_path: "none",
    estimated_risk: plan.estimated_risk === "high" ? "medium" : plan.estimated_risk,
    estimated_cost_bucket: "free",
    estimated_disk_bucket: "low",
    user_visible_warnings: [...warnings],
  };
}
