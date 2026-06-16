import { loadUserV2Config, resolveV2Config, type ResolvedV2Config } from "./config/V2Config.js";
import { RestTransport } from "./sdk/client.js";
import { MockTransport } from "./mock/MockTransport.js";
import { launchApp } from "./ui/App.js";

async function main() {
  const config = await autoDetectLiveBackend(resolveV2Config());
  const transport = config.live ? new RestTransport(config.apiUrl) : new MockTransport();

  launchApp(transport, config);
}

async function autoDetectLiveBackend(config: ResolvedV2Config): Promise<ResolvedV2Config> {
  if (config.live || process.env.OE_LIVE != null || loadUserV2Config().live != null) return config;
  try {
    const signal = AbortSignal.timeout(450);
    const res = await fetch(`${config.apiUrl.replace(/\/$/, "")}/api/v1/health`, { signal });
    return res.ok ? { ...config, live: true } : config;
  } catch {
    return config;
  }
}

void main();
