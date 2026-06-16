import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

export interface UserV2Config {
  live?: boolean;
  apiUrl?: string;
  exportDir?: string;
  offline?: boolean;
}

export interface ResolvedV2Config {
  live: boolean;
  apiUrl: string;
  exportDir: string;
  offline: boolean;
  path: string;
}

const DEFAULT_API_URL = "http://127.0.0.1:8000";
const DEFAULT_EXPORT_DIR = "tmp/exports";

export function v2ConfigPath(): string {
  const base = process.env.XDG_CONFIG_HOME
    ? path.resolve(process.env.XDG_CONFIG_HOME)
    : path.join(os.homedir(), ".config");
  return path.join(base, "omniverse-vision", "v2.json");
}

export function loadUserV2Config(): UserV2Config {
  const filePath = v2ConfigPath();
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as UserV2Config;
  } catch {
    return {};
  }
}

export function resolveV2Config(env: NodeJS.ProcessEnv = process.env): ResolvedV2Config {
  const file = loadUserV2Config();
  return {
    live: env.OE_LIVE != null ? env.OE_LIVE === "1" : file.live ?? false,
    apiUrl: env.OMNISEE_API_URL || file.apiUrl || DEFAULT_API_URL,
    exportDir: env.OV_OBSIDIAN_VAULT || env.OMNISEE_OBSIDIAN_VAULT || file.exportDir || DEFAULT_EXPORT_DIR,
    offline: env.OV_OFFLINE != null ? env.OV_OFFLINE === "1" : file.offline ?? false,
    path: v2ConfigPath(),
  };
}

export async function saveUserV2Config(config: UserV2Config): Promise<string> {
  const filePath = v2ConfigPath();
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, `${JSON.stringify(config, null, 2)}\n`, "utf-8");
  return filePath;
}
