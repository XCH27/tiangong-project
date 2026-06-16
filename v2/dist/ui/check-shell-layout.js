import { visibleWidth } from "@earendil-works/pi-tui";
import { renderShellFixture } from "./Shell.js";
const CASES = [
    { width: 120, height: 30 },
    { width: 100, height: 28 },
    { width: 160, height: 40 },
];
let failed = false;
for (const item of CASES) {
    const lines = renderShellFixture(item.width, item.height);
    if (lines.length !== item.height) {
        console.error(`shell ${item.width}x${item.height}: expected ${item.height} rows, got ${lines.length}`);
        failed = true;
    }
    for (const [index, line] of lines.entries()) {
        const width = visibleWidth(line);
        if (width > item.width) {
            console.error(`shell ${item.width}x${item.height}: row ${index + 1} width ${width} > ${item.width}`);
            failed = true;
        }
    }
    const joined = lines.join("\n");
    const markers = ["OmniVerse Vision", "Primary", "Ask this asset", "第 3 分钟"];
    if (item.width >= 108)
        markers.push("Workbench", "Recent assets");
    for (const marker of markers) {
        if (!joined.includes(marker)) {
            console.error(`shell ${item.width}x${item.height}: missing marker ${marker}`);
            failed = true;
        }
    }
}
if (failed)
    process.exit(1);
console.log(`shell layout check passed (${CASES.length} viewports)`);
