import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import type { AnalyzeRequest } from "../sdk/client.js";

type ClientProvided = NonNullable<AnalyzeRequest["client_provided"]>;

export async function loadClientProvidedInput(filePath: string): Promise<ClientProvided> {
  const resolved = expandUserPath(filePath);
  const content = await fs.readFile(resolved, "utf-8");
  if (path.extname(resolved).toLowerCase() === ".json") {
    return clientProvidedFromJson(JSON.parse(content));
  }
  return subtitleFromText(content, resolved);
}

function clientProvidedFromJson(value: unknown): ClientProvided {
  if (!value || typeof value !== "object") {
    throw new Error("Client-provided handoff JSON must be an object.");
  }
  const data = value as Record<string, any>;
  const provided = data.client_provided?.subtitle ?? data.subtitle;
  if (!provided || typeof provided !== "object") {
    throw new Error("Client-provided handoff JSON must contain subtitle or client_provided.subtitle.");
  }
  if (typeof provided.content !== "string" || !provided.content.trim()) {
    throw new Error("Client-provided subtitle content is empty.");
  }
  return {
    subtitle: {
      content: provided.content,
      format: String(provided.format || "srt"),
      language: String(provided.language || "zh-Hans"),
      source: String(provided.source || "v2_client_provided_handoff"),
    }
  };
}

function subtitleFromText(content: string, resolvedPath: string): ClientProvided {
  return {
    subtitle: {
      content,
      format: subtitleFormat(resolvedPath),
      language: "zh-Hans",
      source: "v2_user_provided_subtitle",
    }
  };
}

function expandUserPath(filePath: string): string {
  if (filePath === "~") return os.homedir();
  if (filePath.startsWith("~/")) return path.join(os.homedir(), filePath.slice(2));
  return filePath;
}

function subtitleFormat(filePath: string): string {
  const ext = path.extname(filePath).replace(".", "").toLowerCase();
  return ext === "vtt" || ext === "ass" || ext === "json" || ext === "srt" ? ext : "srt";
}
