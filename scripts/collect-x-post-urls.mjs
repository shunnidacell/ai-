import { chromium } from "playwright-core";

const APP_ORIGIN = process.env.APP_ORIGIN ?? "http://127.0.0.1:3000";
const PROFILE_DIR = process.env.X_BROWSER_PROFILE ?? ".x-browser-profile";
const MAX_PER_QUERY = Number(process.env.X_MAX_PER_QUERY ?? 8);
const HEADLESS = process.env.X_HEADLESS === "1";
const KEEP_OPEN = process.env.X_KEEP_OPEN === "1";

const chromePaths = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
].filter(Boolean);

async function main() {
  const executablePath = chromePaths.find(Boolean);

  if (!executablePath) {
    throw new Error("Chrome executable was not found. Set CHROME_PATH.");
  }

  const discovery = await fetch(`${APP_ORIGIN}/api/x-discovery`).then((res) =>
    res.json(),
  );
  const browser = await chromium.launchPersistentContext(PROFILE_DIR, {
    channel: undefined,
    executablePath,
    headless: HEADLESS,
    viewport: { width: 1280, height: 900 },
  });
  const page = await browser.newPage();
  const discovered = new Set();

  for (const query of discovery.queries ?? []) {
    console.log(`\nSearching: ${query.label}`);
    console.log(query.searchUrl);
    await page.goto(query.searchUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(4500);

    const state = await detectXState(page);
    if (state !== "results") {
      console.log(`X page state: ${state}`);
      if (state === "login_required") {
        console.log(
          "Login required. Run with X_KEEP_OPEN=1, log in, then run collection again.",
        );
      }
    }

    for (let i = 0; i < 5; i += 1) {
      const urls = await collectStatusUrls(page);
      for (const url of urls) {
        discovered.add(url);
      }

      if (discovered.size >= MAX_PER_QUERY) {
        break;
      }

      await page.mouse.wheel(0, 1400);
      await page.waitForTimeout(1600);
    }
  }

  const urls = [...discovered].slice(0, MAX_PER_QUERY * 3);
  console.log(`\nFound ${urls.length} candidate URLs.`);

  if (urls.length > 0) {
    const result = await fetch(`${APP_ORIGIN}/api/x-candidates`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ urls }),
    }).then((res) => res.json());

    console.log(JSON.stringify(result, null, 2));
  }

  if (KEEP_OPEN) {
    console.log("\nKeeping Chrome open. Log in to X, then stop this command and run again.");
  } else {
    await browser.close();
  }
}

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

    if (hasStatusLinks) return "results";
    if (
      text.includes("Sign in") ||
      text.includes("Log in") ||
      text.includes("ログイン") ||
      text.includes("アカウント")
    ) {
      return "login_required";
    }
    if (text.includes("Something went wrong") || text.includes("問題が発生しました")) {
      return "blocked_or_error";
    }
    return "no_results";
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
