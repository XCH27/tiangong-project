import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { parseComposerInput } from "./InputIntent.js";
import { DEFAULT_SKILLS } from "../mock/data.js";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ovv-v2-intent-"));
const handoff = path.join(tmp, "handoff.json");
fs.writeFileSync(
  handoff,
  JSON.stringify({
    source: "https://www.bilibili.com/video/BV1fixture",
    subtitle: {
      content: "1\n00:00:00,000 --> 00:00:01,000\nhello\n",
      format: "srt",
      language: "zh",
    },
  }),
  "utf-8"
);

let failed = false;
function assert(condition: unknown, message: string) {
  if (!condition) {
    console.error(message);
    failed = true;
  }
}

const direct = parseComposerInput(handoff, DEFAULT_SKILLS, "note");
assert(direct.source === "https://www.bilibili.com/video/BV1fixture", "direct handoff source not extracted");
assert(direct.clientProvidedPath === handoff, "direct handoff path not selected");

const paired = parseComposerInput(`https://example.com/video :: ${handoff}`, DEFAULT_SKILLS, "note");
assert(paired.source === "https://example.com/video", "paired URL source not preserved");
assert(paired.clientProvidedPath === handoff, "paired handoff path not selected");

const reversePrompt = parseComposerInput("请反推提示词 /tmp/image.png", DEFAULT_SKILLS, "note");
assert(reversePrompt.skillName === "note" || reversePrompt.skillName === "reverse-prompt", "skill fallback changed unexpectedly");

fs.rmSync(tmp, { recursive: true, force: true });
if (failed) process.exit(1);
console.log("input intent check passed");
