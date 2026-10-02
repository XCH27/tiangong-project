import assert from "node:assert/strict";
import test from "node:test";
import { decide } from "./native-approval-hook.mjs";

const input = { conversation_id: "fixture-session", tool_call: { name: "write_to_file", args: {} } };
const env = { FLEET_NATIVE_SESSION: "fixture-session", FLEET_NATIVE_HOOK_TOKEN: "fixture-only", FLEET_NATIVE_HOOK_URL: "http://127.0.0.1:54321/fixture" };
test("native hook denies missing authorization, wrong sessions and non-local callbacks before transport", async () => {
  const never = async () => { throw new Error("Transport must not run"); };
  for (const candidate of [{}, { ...env, FLEET_NATIVE_SESSION: "other" }, { ...env, FLEET_NATIVE_HOOK_URL: "https://external.invalid" }])
    assert.equal((await decide(input, candidate, never)).decision, "deny");
});
test("native hook forwards only the current session and requires an explicit Host decision", async () => {
  for (const decision of ["allow", "deny", undefined]) {
    const result = await decide(input, env, async (url, options) => {
      assert.equal(String(url), env.FLEET_NATIVE_HOOK_URL);
      assert.equal(options.headers.authorization, "Bearer fixture-only");
      assert.deepEqual(JSON.parse(options.body), input);
      return Response.json({ decision });
    });
    assert.equal(result.decision, decision ?? "deny");
  }
});
test("native hook never turns a failed, interrupted or malformed callback into approval", async () => {
  for (const transport of [async () => new Response("denied", { status: 403 }), async () => { throw new Error("interrupted"); }, async () => new Response("not-json")])
    assert.equal((await decide(input, env, transport)).decision, "deny");
});
