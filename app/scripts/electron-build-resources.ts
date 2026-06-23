/**
 * Cross-platform resources copy script
 */

import { existsSync, cpSync, mkdirSync } from "fs";
import { join } from "path";

const ROOT_DIR = join(import.meta.dir, "..");
const ELECTRON_DIR = join(ROOT_DIR, "apps/electron");

const srcDir = join(ELECTRON_DIR, "resources");
const destDir = join(ELECTRON_DIR, "dist/resources");

if (existsSync(srcDir)) {
  cpSync(srcDir, destDir, { recursive: true, force: true });
  console.log("📦 Copied resources to dist");
} else {
  console.log("⚠️ No resources directory found");
}

const subprocessServers = [
  "session-mcp-server",
  "pi-agent-server",
];

for (const serverName of subprocessServers) {
  const src = join(ROOT_DIR, "packages", serverName, "dist", "index.js");
  const dest = join(destDir, serverName, "index.js");
  if (!existsSync(src)) {
    console.log(`⚠️ ${serverName} dist not found; run bun run server:build:subprocess before packaging`);
    continue;
  }
  mkdirSync(join(destDir, serverName), { recursive: true });
  cpSync(src, dest, { force: true });
  console.log(`📦 Copied ${serverName} → dist/resources/${serverName}/`);
}
