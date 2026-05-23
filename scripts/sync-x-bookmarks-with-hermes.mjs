import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

await loadDotEnvLocal();

const siteUrl = process.env.SITE_URL ?? "https://ai-3636.onrender.com";
const adminUser = process.env.ADMIN_USER;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminUser || !adminPassword) {
  console.error(
    "ADMIN_USER and ADMIN_PASSWORD are missing. Save them in .env.local.",
  );
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
  console.log("No X bookmark post URLs were found.");
  console.log("Hermes output:");
  console.log(stdout.trim() || "(empty)");
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
  console.error(result.error ?? `Registration failed. status=${response.status}`);
  process.exit(1);
}

console.log(`${urls.length} X bookmark URLs were synced to candidates.`);
for (const url of urls) {
  console.log(url);
}

async function loadDotEnvLocal() {
  let raw = "";

  try {
    raw = await readFile(".env.local", "utf8");
  } catch {
    return;
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalIndex = trimmed.indexOf("=");

    if (equalIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, equalIndex).trim();
    const value = unquoteEnvValue(trimmed.slice(equalIndex + 1).trim());

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function unquoteEnvValue(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
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
