// Bounded source execution. No DeepSeek Host, account, provider call or user settings are involved.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "../..");
const source = resolve(root, "源码参考/software/deepseek-harness");
const pin = "639ed015397290b3745d163aafe02ffee4aa3f84";
assert.equal(execFileSync("git", ["-C", source, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(), pin,
  "Review the changed reference before reusing this probe");
const load = file => import(pathToFileURL(resolve(source, file)).href);
const { rankByName } = await load("packages/client/ui-primitives/src/rank-by-name.ts");
const { presentationPolicyFor } = await load("packages/client/ui-chat/src/client/presentation-policy.ts");
const { TimedQuestionWait } = await load("packages/interaction/user-questions/src/timed-wait.ts");

const items = [{ name: "deepseek-v4-flash", label: "DeepSeek Flash" },
  { name: "deepseek-v4-pro", label: "DeepSeek Pro" }, { name: "qwen", label: "通义千问" }];
assert.equal(rankByName(items, ""), items);
assert.deepEqual(rankByName(items, "DSV4").map(row => row.name), ["deepseek-v4-flash", "deepseek-v4-pro"]);
assert.deepEqual(rankByName(items, "千问").map(row => row.name), ["qwen"]);
assert.deepEqual(rankByName(items, "not-in-the-catalog"), []);
console.log("PASS original fuzzy ranking: subsequence, localized label, stable order and no invented candidate");

assert.equal(presentationPolicyFor("compact"), presentationPolicyFor("compact"));
assert.equal(presentationPolicyFor("compact").liveProcessDetail, false);
assert.equal(presentationPolicyFor("standard").liveProcessDetail, true);
assert.equal(presentationPolicyFor("verbose").foldCompletedTurns, false);
console.log("PASS original work-detail policy: stable presentation projection, separate from execution configuration");

const parent = new AbortController();
const timeout = new Error("unanswered fixture question");
const wait = new TimedQuestionWait(Date.now() + 20, parent.signal, timeout);
await wait.done;
assert.equal(wait.signal.reason, timeout);
assert.equal(parent.signal.aborted, false);
console.log("PASS original unanswered wait: child expires without cancelling the parent Turn");

const claimed = new TimedQuestionWait(Date.now() + 30, parent.signal, timeout);
const client = new AbortController();
const claim = claimed.attach(client.signal);
assert.equal((await claim.next()).done, false);
await new Promise(resolve => setTimeout(resolve, 50));
assert.equal(claimed.signal.aborted, false);
client.abort();
await claim.next();
await claimed.done;
assert.equal(claimed.signal.reason, timeout);
assert.equal(parent.signal.aborted, false);
console.log("PASS original answer-UI claim: holds foreground wait; leaving resumes deadline; no implicit approval");
console.log(`SOURCE ${pin}: four mechanism checks, zero provider calls, zero user-state writes`);
