import assert from "node:assert/strict";
import test from "node:test";
import { decide } from "./native-approval-hook.mjs";

// Official AGY PreToolUse uses camelCase; its stream frames use a different schema.
const input = {
  conversationId: "fixture-session", workspacePaths: ["/fixture"], modelName: "fixture-model",
  stepIdx: 3, toolCall: { name: "write_to_file", args: { TargetFile: "/fixture/result.md" } },
};
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

test("official hook input keeps execution identity without forwarding transcript or arbitrary metadata", async () => {
  const result = await decide({ ...input, transcriptPath: "/private/history.jsonl", artifactDirectoryPath: "/private/artifacts", unknown: "ignored" }, env,
    async (_url, options) => {
      assert.deepEqual(JSON.parse(options.body), input);
      return Response.json({ decision: "allow", permissionOverrides: ["command(*)"] });
    });
  assert.deepEqual(result, { decision: "allow", reason: "Host decision" });
});

test("malformed and stream-shaped payloads never reach the Host", async () => {
  const never = async () => { throw new Error("Transport must not run"); };
  for (const malformed of [
    { conversation_id: "fixture-session", tool_call: { name: "write_to_file", args: {} } },
    { ...input, toolCall: { name: "", args: {} } },
    { ...input, toolCall: { name: "write_to_file", args: [] } },
    { ...input, workspacePaths: [] }, { ...input, workspacePaths: [null] },
    { ...input, stepIdx: -1 }, { ...input, stepIdx: 0.5 }, { ...input, modelName: null },
  ]) assert.equal((await decide(malformed, env, never)).decision, "deny");
});
