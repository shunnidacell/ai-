import { spawn } from "node:child_process";

const intervalMinutes = Number(process.env.BOOKMARK_SYNC_INTERVAL_MINUTES ?? 30);
const intervalMs = Math.max(intervalMinutes, 1) * 60 * 1000;

console.log(`Bookmark auto sync started. Interval: ${intervalMinutes} minutes.`);
console.log("Press Ctrl+C to stop.");

await runOnce();
setInterval(runOnce, intervalMs);

async function runOnce() {
  const startedAt = new Date();
  console.log(`\n[${startedAt.toLocaleString()}] Syncing X bookmarks...`);

  await new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ["scripts/sync-x-bookmarks-with-chrome.mjs"],
      {
        env: {
          ...process.env,
          X_HEADLESS: process.env.X_HEADLESS ?? "1",
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
      resolve();
    });
  });
}
