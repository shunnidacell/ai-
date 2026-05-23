import { readFile } from "node:fs/promises";
import { chromium } from "playwright-core";

await loadDotEnvLocal();

const siteUrl = process.env.SITE_URL ?? "https://ai-3636.onrender.com";
const adminUser = process.env.ADMIN_USER;
const adminPassword = process.env.ADMIN_PASSWORD;
const profileDir = process.env.X_BROWSER_PROFILE ?? ".x-browser-profile";
const keepOpen = process.env.X_KEEP_OPEN === "1";
const maxBookmarks = Number(process.env.X_BOOKMARK_LIMIT ?? 30);

const chromePaths = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
].filter(Boolean);

if (!adminUser || !adminPassword) {
  console.error(
    "ADMIN_USER and ADMIN_PASSWORD are missing. Save them in .env.local.",
  );
  process.exit(1);
}

const executablePath = chromePaths.find(Boolean);

if (!executablePath) {
  console.error("Chrome executable was not found. Set CHROME_PATH in .env.local.");
  process.exit(1);
}

const browser = await chromium.launchPersistentContext(profileDir, {
  executablePath,
  headless: false,
  viewport: { width: 1280, height: 900 },
});

const page = await browser.newPage();
await page.goto("https://x.com/i/bookmarks", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);

const state = await detectXState(page);

if (state === "login_required") {
  console.log("Chrome opened X login. Log in there, then run this command again.");
  console.log("Keeping Chrome open.");
  await waitForever();
}

if (state === "blocked_or_error") {
  console.log("X showed an error or blocked the page. Check the visible Chrome window.");
  if (keepOpen) await waitForever();
  await browser.close();
  process.exit(1);
}

const discovered = new Set();

for (let i = 0; i < 8; i += 1) {
  const urls = await collectStatusUrls(page);
  for (const url of urls) {
    discovered.add(url);
  }

  if (discovered.size >= maxBookmarks) {
    break;
  }

  await page.mouse.wheel(0, 1300);
  await page.waitForTimeout(1400);
}

const urls = [...discovered].slice(0, maxBookmarks);

if (urls.length === 0) {
  console.log("No X bookmark post URLs were found in the visible Chrome page.");
  if (keepOpen) await waitForever();
  await browser.close();
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
  if (keepOpen) await waitForever();
  await browser.close();
  process.exit(1);
}

console.log(`${urls.length} X bookmark URLs were synced to candidates.`);
for (const url of urls) {
  console.log(url);
}

if (keepOpen) {
  await waitForever();
}

await browser.close();

async function collectStatusUrls(page) {
  return page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href*="/status/"]'));
    return anchors
      .map((anchor) => anchor.href)
      .map((href) => {
        try {
          const url = new URL(href);
          const match = url.pathname.match(/^\/([^/]+)\/status\/(\d+)/);
          if (!match) return null;
          return `https://x.com/${match[1]}/status/${match[2]}`;
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  });
}

async function detectXState(page) {
  return page.evaluate(() => {
    const text = document.body?.innerText ?? "";
    const hasStatusLinks = Boolean(document.querySelector('a[href*="/status/"]'));

    if (hasStatusLinks) return "bookmarks";
    if (
      text.includes("Sign in") ||
      text.includes("Log in") ||
      text.includes("ログイン") ||
      location.href.includes("/i/flow/login")
    ) {
      return "login_required";
    }
    if (text.includes("Something went wrong") || text.includes("問題が発生しました")) {
      return "blocked_or_error";
    }
    return "unknown";
  });
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

function waitForever() {
  return new Promise(() => {});
}
