// Isolated preflight for the native AGY PreToolUse bridge. Not a production listener.
import { stdin, stdout } from "node:process";

export async function decide(input, env, fetcher = fetch) {
  const denied = reason => ({ decision: "deny", reason });
  if (!input || typeof input !== "object" || !input.tool_call?.name)
    return denied("Malformed native tool request");
  if (!env.FLEET_NATIVE_SESSION || input.conversation_id !== env.FLEET_NATIVE_SESSION)
    return denied("Native session changed");
  if (!env.FLEET_NATIVE_HOOK_TOKEN) return denied("Missing session authorization");
  let url;
  try { url = new URL(env.FLEET_NATIVE_HOOK_URL); }
  catch { return denied("Missing local callback"); }
  if (url.protocol !== "http:" || url.hostname !== "127.0.0.1" || url.username || url.password)
    return denied("Callback must stay on this host");
  try {
    const response = await fetcher(url, {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(15000),
      headers: { "content-type": "application/json", "authorization": `Bearer ${env.FLEET_NATIVE_HOOK_TOKEN}` },
      body: JSON.stringify(input),
    });
    if (!response.ok) return denied("Host refused the tool request");
    const answer = await response.json();
    if (answer?.decision !== "allow" && answer?.decision !== "deny")
      return denied("Host returned no explicit decision");
    return { decision: answer.decision, reason: String(answer.reason ?? "Host decision") };
  } catch { return denied("Host is unavailable or the approval deadline elapsed"); }
}

if (process.argv[1] && new URL(import.meta.url).pathname.endsWith("/" + process.argv[1].split("/").at(-1))) {
  let raw = "";
  try {
    for await (const chunk of stdin) {
      raw += chunk;
      if (Buffer.byteLength(raw) > 1048576) throw new Error("Oversized request");
    }
    stdout.write(JSON.stringify(await decide(JSON.parse(raw), process.env)));
  } catch { stdout.write(JSON.stringify({ decision: "deny", reason: "Unreadable tool request" })); }
}
