import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const intervalMinutes = Number(process.env.BOOKMARK_SYNC_INTERVAL_MINUTES ?? 10);
const intervalMs = Math.max(intervalMinutes, 1) * 60 * 1000;
const disabledFile = "data/bookmark-sync-disabled";

console.log(`Bookmark auto sync started. Interval: ${intervalMinutes} minutes.`);
console.log(`Create ${disabledFile} to pause automatic sync.`);
console.log("Press Ctrl+C to stop.");

await runOnce();
setInterval(runOnce, intervalMs);

async function runOnce() {
  if (existsSync(disabledFile)) {
    console.log(`[${new Date().toLocaleString()}] Bookmark auto sync is paused.`);
    return;
  }

  const startedAt = new Date();
  console.log(`\n[${startedAt.toLocaleString()}] Syncing X bookmarks...`);

  await new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ["scripts/sync-x-bookmarks-with-chrome.mjs"],
      {
        env: {
          ...process.env,
          X_HEADLESS: process.env.X_HEADLESS ?? "0",
        },
        shell: false,
        stdio: "inherit",
      },
    );

    child.on("exit", (code) => {
      if (code === 0) {
        console.log(`[${new Date().toLocaleString()}] Bookmark sync finished.`);
      } else {
        console.log(`[${new Date().toLocaleString()}] Bookmark sync exited with code ${code}.`);
      }
      resolve(code);
    });
  });

  await runLocalDraftGeneration();
}

async function runLocalDraftGeneration() {
  if (process.env.LOCAL_DRAFT_GENERATION === "0") {
    return;
  }

  await new Promise((resolve) => {
    const child = spawn(process.execPath, ["scripts/generate-candidate-drafts-local.mjs"], {
      env: process.env,
      shell: false,
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        console.log(`[${new Date().toLocaleString()}] Local draft generation finished.`);
      } else {
        console.log(`[${new Date().toLocaleString()}] Local draft generation exited with code ${code}.`);
      }
      resolve();
    });
  });
}
