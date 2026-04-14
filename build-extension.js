/**
 * build-extension.js
 * Run: node build-extension.js
 *
 * Zips the /extension folder into clutch-extension.zip
 * ready to load into Chrome (or upload to GitHub releases).
 */
import { createWriteStream, existsSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { createGzip } from "zlib";

// Simple zip implementation using Node.js built-ins
// For a proper zip we need the 'archiver' package — install it first:
//   npm install archiver --save-dev

async function buildZip() {
  let archiver;
  try {
    const mod = await import("archiver");
    archiver = mod.default;
  } catch {
    console.log('\n⚠ "archiver" not installed. Running: npm install archiver --save-dev\n');
    const { execSync } = await import("child_process");
    execSync("npm install archiver --save-dev", { stdio: "inherit" });
    const mod = await import("archiver");
    archiver = mod.default;
  }

  const output  = createWriteStream("dist/clutch-extension.zip");
  const archive = archiver("zip", { zlib: { level: 9 } });

  output.on("close", () => {
    const kb = (archive.pointer() / 1024).toFixed(1);
    console.log(`\n✓ Extension zipped: dist/clutch-extension.zip (${kb} KB)`);
    console.log("\nTo install in Chrome:");
    console.log("  1. Extract clutch-extension.zip");
    console.log("  2. Chrome → chrome://extensions");
    console.log("  3. Enable Developer mode (top right toggle)");
    console.log("  4. Click 'Load unpacked' → select the extracted folder");
  });

  archive.on("error", err => { throw err; });
  archive.pipe(output);

  // Add all extension files
  archive.directory("extension/", false);

  await archive.finalize();
}

buildZip().catch(console.error);
