import { saveUserV2Config } from "../config/V2Config.js";
export function userConfigFromResolved(config) {
    return {
        live: config.live,
        apiUrl: config.apiUrl,
        exportDir: config.exportDir,
        offline: config.offline,
    };
}
export async function persistResolvedConfig(config) {
    return saveUserV2Config(userConfigFromResolved(config));
}
export function describeConnection(config, doctor) {
    const target = config.live ? config.apiUrl : "mock transport";
    const status = doctor
        ? `${doctor.status}; tier=${doctor.computed_tier}; ffmpeg=${doctor.ffmpeg_status}`
        : "doctor unavailable";
    return `${target} -> ${status}`;
}
