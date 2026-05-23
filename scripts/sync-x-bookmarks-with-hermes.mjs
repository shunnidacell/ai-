import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const siteUrl = process.env.SITE_URL ?? "https://ai-3636.onrender.com";
const adminUser = process.env.ADMIN_USER;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminUser || !adminPassword) {
  console.error("ADMIN_USER と ADMIN_PASSWORD を環境変数に設定してください。");
  process.exit(1);
}

const prompt = await readFile("data/hermes-bookmarks-prompt.txt", "utf8");
const { stdout, stderr } = await execFileAsync("wsl", [
  "-e",
  "bash",
  "-lc",
  `hermes -z ${shellQuote(prompt)} --skills social-media:xurl`,
], {
  maxBuffer: 1024 * 1024,
  timeout: 240_000,
});

const urls = extractXPostUrls(stdout);

if (stderr.trim()) {
  console.error(stderr.trim());
}

if (urls.length === 0) {
  console.log("ブックマークから登録できるXポストURLは見つかりませんでした。");
  process.exit(0);
}

const response = await fetch(`${siteUrl.replace(/\/$/, "")}/api/x-candidates`, {
  method: "POST",
  headers: {
    authorization: `Basic ${Buffer.from(`${adminUser}:${adminPassword}`).toString("base64")}`,
    "content-type": "application/json",
  },
  body: JSON.stringify({ urls }),
});

const result = await response.json().catch(() => ({}));

if (!response.ok) {
  console.error(result.error ?? `登録に失敗しました。status=${response.status}`);
  process.exit(1);
}

console.log(`${urls.length}件のXブックマークURLを候補へ同期しました。`);
for (const url of urls) {
  console.log(url);
}

function extractXPostUrls(text) {
  const matches = text.match(/https:\/\/(?:x|twitter)\.com\/[^/\s]+\/status\/\d+/g);
  return [...new Set(matches ?? [])].map((url) =>
    url.replace("https://twitter.com/", "https://x.com/"),
  );
}

function shellQuote(value) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}
