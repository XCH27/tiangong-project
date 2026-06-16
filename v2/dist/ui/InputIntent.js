import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
const URL_RE = /https?:\/\/[^\s，。；；、]+/i;
const QUOTED_RE = /["'“”]([^"'“”]+)["'“”]/;
export function parseComposerInput(value, skills, currentSkill) {
    const [sourcePart, providedPath] = splitClientProvidedInput(value);
    const handoffFromSource = handoffFromPath(sourcePart);
    const cleanProvidedPath = providedPath ? cleanSource(providedPath) : undefined;
    const clientProvidedPath = cleanProvidedPath && isJsonPath(cleanProvidedPath) ? cleanProvidedPath : handoffFromSource?.path;
    const subtitlePath = cleanProvidedPath && !isJsonPath(cleanProvidedPath) ? cleanProvidedPath : undefined;
    const source = handoffFromSource?.source ?? extractSource(sourcePart);
    return {
        source,
        subtitlePath,
        clientProvidedPath,
        skillName: inferSkillName(sourcePart, skills) ?? currentSkill,
    };
}
function splitClientProvidedInput(value) {
    const parts = value.split(/\s*::\s*/, 2).map((part) => part.trim()).filter(Boolean);
    return [parts[0] ?? value.trim(), parts[1]];
}
function extractSource(value) {
    const url = value.match(URL_RE)?.[0];
    if (url)
        return cleanSource(url);
    const quoted = value.match(QUOTED_RE)?.[1];
    if (quoted && isExistingPath(quoted))
        return cleanSource(quoted);
    for (const token of value.split(/\s+/).reverse()) {
        if (isExistingPath(token) || looksLikeFilePath(token))
            return cleanSource(token);
    }
    return value.trim();
}
function inferSkillName(value, skills) {
    const text = value.toLowerCase();
    const has = (name) => skills.some((skill) => skill.name === name);
    if (/(反推|提示词|prompt|midjourney|stable diffusion|sdxl)/i.test(value)) {
        if (has("reverse-prompt"))
            return "reverse-prompt";
        if (has("reverse_prompt"))
            return "reverse_prompt";
    }
    if (/(视觉|画面|截图|看图|image|visual|caption|vqa|ocr)/i.test(value) && has("visual"))
        return "visual";
    if ((text.includes("transcript") || value.includes("字幕") || value.includes("转写")) && has("transcript"))
        return "transcript";
    if ((text.includes("extract") || value.includes("提取")) && has("extract"))
        return "extract";
    if ((text.includes("index") || text.includes("rag") || value.includes("索引") || value.includes("知识库")) && has("index"))
        return "index";
    if ((text.includes("blog") || text.includes("tweet") || value.includes("改写") || value.includes("小红书")) && has("repurpose"))
        return "repurpose";
    return undefined;
}
function looksLikeFilePath(value) {
    return value.startsWith("~/") || value.startsWith("/") || /^[A-Za-z]:[\\/]/.test(value);
}
function isExistingPath(value) {
    try {
        const expanded = value === "~" ? os.homedir() : value.startsWith("~/") ? path.join(os.homedir(), value.slice(2)) : value;
        return fs.existsSync(expanded);
    }
    catch {
        return false;
    }
}
function cleanSource(value) {
    return value.replace(/[，。,.、；;）)]$/u, "");
}
function isJsonPath(value) {
    return path.extname(cleanSource(value)).toLowerCase() === ".json";
}
function handoffFromPath(value) {
    const candidate = cleanSource(extractSourceCandidate(value));
    if (!isJsonPath(candidate) || !isExistingPath(candidate))
        return null;
    try {
        const expanded = candidate === "~" ? os.homedir() : candidate.startsWith("~/") ? path.join(os.homedir(), candidate.slice(2)) : candidate;
        const data = JSON.parse(fs.readFileSync(expanded, "utf-8"));
        const source = data.source || data.url || data.media?.source || data.media?.url;
        return typeof source === "string" && source.trim() ? { path: candidate, source: source.trim() } : null;
    }
    catch {
        return null;
    }
}
function extractSourceCandidate(value) {
    const quoted = value.match(QUOTED_RE)?.[1];
    if (quoted)
        return quoted;
    for (const token of value.split(/\s+/).reverse()) {
        if (looksLikeFilePath(token))
            return token;
    }
    return value.trim();
}
