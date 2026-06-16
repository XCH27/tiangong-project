import { saveUserV2Config, type ResolvedV2Config, type UserV2Config } from "../config/V2Config.js";
import type { DoctorSummary } from "../types/contracts.js";

export function userConfigFromResolved(config: ResolvedV2Config): UserV2Config {
  return {
    live: config.live,
    apiUrl: config.apiUrl,
    exportDir: config.exportDir,
    offline: config.offline,
  };
}

export async function persistResolvedConfig(config: ResolvedV2Config): Promise<string> {
  return saveUserV2Config(userConfigFromResolved(config));
}

export function describeConnection(config: ResolvedV2Config, doctor: DoctorSummary | null): string {
  const target = config.live ? config.apiUrl : "mock transport";
  const status = doctor
    ? `${doctor.status}; tier=${doctor.computed_tier}; ffmpeg=${doctor.ffmpeg_status}`
    : "doctor unavailable";
  return `${target} -> ${status}`;
}
