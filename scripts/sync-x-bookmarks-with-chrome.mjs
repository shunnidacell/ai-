import { readFile } from "node:fs/promises";
import { chromium } from "playwright-core";

await loadDotEnvLocal();

const siteUrl = process.env.SITE_URL ?? "https://ai-3636.onrender.com";
const adminUser = process.env.ADMIN_USER;
const adminPassword = process.env.ADMIN_PASSWORD;
const profileDir = process.env.X_BROWSER_PROFILE ?? ".x-browser-profile";
const keepOpen = process.env.X_KEEP_OPEN === "1";
const maxBookmarks = Number(process.env.X_BOOKMARK_LIMIT ?? 30);
const headless = process.env.X_HEADLESS === "1";

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
  headless,
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

const discovered = new Map();

for (let i = 0; i < 8; i += 1) {
  const posts = await collectBookmarkPosts(page);
  for (const post of posts) {
    if (!discovered.has(post.url)) {
      discovered.set(post.url, post);
    } else {
      const current = discovered.get(post.url);
      discovered.set(post.url, {
        ...current,
        postImageUrl: current.postImageUrl ?? post.postImageUrl,
        postText: current.postText ?? post.postText,
      });
    }
  }

  if (discovered.size >= maxBookmarks) {
    break;
  }

  await page.mouse.wheel(0, 1300);
  await page.waitForTimeout(1400);
}

let posts = [...discovered.values()].slice(0, maxBookmarks);

if (posts.length === 0) {
  console.log("No X bookmark post URLs were found in the visible Chrome page.");
  if (keepOpen) await waitForever();
  await browser.close();
  process.exit(0);
}

posts = await enrichPostsFromStatusPages(page, posts);

const response = await fetch(`${siteUrl.replace(/\/$/, "")}/api/x-candidates`, {
  method: "POST",
  headers: {
    authorization: `Basic ${Buffer.from(`${adminUser}:${adminPassword}`).toString("base64")}`,
    "content-type": "application/json",
  },
  body: JSON.stringify({ posts, urls: posts.map((post) => post.url) }),
});

const result = await response.json().catch(() => ({}));

if (!response.ok) {
  console.error(result.error ?? `Registration failed. status=${response.status}`);
  if (keepOpen) await waitForever();
  await browser.close();
  process.exit(1);
}

console.log(
  `${posts.length} X bookmark posts were synced to candidates. ` +
    `Text found: ${posts.filter((post) => post.postText).length}/${posts.length}.`,
);
for (const post of posts) {
  console.log(`${post.postText ? "[text]" : "[url] "} ${post.url}`);
}

if (keepOpen) {
  await waitForever();
}

await browser.close();

async function collectBookmarkPosts(page) {
  return page.evaluate(() => {
    const articles = Array.from(document.querySelectorAll('article'));
    const posts = [];

    for (const article of articles) {
      const statusAnchor = Array.from(
        article.querySelectorAll('a[href*="/status/"]'),
      ).find((anchor) => {
        try {
          const url = new URL(anchor.href);
          return /^\/[^/]+\/status\/\d+/.test(url.pathname);
        } catch {
          return false;
        }
      });

      if (!statusAnchor) continue;

      const url = normalizeStatusUrl(statusAnchor.href);
      if (!url) continue;

      const tweetText = article.querySelector('[data-testid="tweetText"]');
      const postText =
        tweetText?.innerText?.trim() ||
        Array.from(article.querySelectorAll('[lang]'))
          .map((node) => node.innerText?.trim())
          .filter(Boolean)
          .join("\n")
          .trim() ||
        cleanPostText(article.innerText) ||
        undefined;

      const postImageUrl =
        Array.from(article.querySelectorAll('img[src*="twimg.com/media"]'))
          .map((image) => image.src)
          .find(Boolean) || undefined;

      posts.push({ postImageUrl, postText, url });
    }

    if (posts.length > 0) {
      return posts;
    }

    return Array.from(document.querySelectorAll('a[href*="/status/"]'))
      .map((anchor) => normalizeStatusUrl(anchor.href))
      .filter(Boolean)
      .map((url) => ({ url }));

    function normalizeStatusUrl(href) {
      try {
        const url = new URL(href);
        const match = url.pathname.match(/^\/([^/]+)\/status\/(\d+)/);
        if (!match) return null;
        return `https://x.com/${match[1]}/status/${match[2]}`;
      } catch {
        return null;
      }
    }

    function cleanPostText(raw) {
      const noise = new Set([
        "Ad",
        "From",
        "Like",
        "Likes",
        "Log in",
        "Post",
        "Quote",
        "Reply",
        "Repost",
        "Reposts",
        "Share",
        "Show more",
        "Sign in",
        "Translate post",
        "View",
      ]);

      const lines = String(raw ?? "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => !noise.has(line))
        .filter((line) => !/^@\w+$/.test(line))
        .filter((line) => !/^\d+[,.]?\d*[KMB]?$/.test(line))
        .filter((line) => !/^\d+\s*(Reply|Replies|Repost|Reposts|Like|Likes|View|Views)$/i.test(line))
        .filter((line) => !/^·$/.test(line));

      return lines.join("\n").trim();
    }
  });
}

async function enrichPostsFromStatusPages(page, posts) {
  const enriched = [];

  for (const post of posts) {
    if (post.postText?.trim()) {
      enriched.push(post);
      continue;
    }

    try {
      await page.goto(post.url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(3500);
      const details = await collectPostDetails(page);
      enriched.push({
        ...post,
        postImageUrl: post.postImageUrl ?? details.postImageUrl,
        postText: details.postText ?? post.postText,
      });
    } catch (error) {
      console.warn(`Could not read post text: ${post.url}`);
      enriched.push(post);
    }
  }

  return enriched;
}

async function collectPostDetails(page) {
  return page.evaluate(() => {
    const article = document.querySelector('article');

    if (!article) {
      return {};
    }

    const tweetText = article.querySelector('[data-testid="tweetText"]');
    const postText =
      tweetText?.innerText?.trim() ||
      Array.from(article.querySelectorAll('[data-testid="tweetText"] span, [lang]'))
        .map((node) => node.innerText?.trim())
        .filter(Boolean)
        .join("\n")
        .trim() ||
      cleanPostText(article.innerText) ||
      undefined;

    const postImageUrl =
      Array.from(article.querySelectorAll('img[src*="twimg.com/media"]'))
        .map((image) => image.src)
        .find(Boolean) || undefined;

    return { postImageUrl, postText };

    function cleanPostText(raw) {
      const noise = new Set([
        "Ad",
        "From",
        "Like",
        "Likes",
        "Log in",
        "Post",
        "Quote",
        "Reply",
        "Repost",
        "Reposts",
        "Share",
        "Show more",
        "Sign in",
        "Translate post",
        "View",
      ]);

      const lines = String(raw ?? "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => !noise.has(line))
        .filter((line) => !/^@\w+$/.test(line))
        .filter((line) => !/^\d+[,.]?\d*[KMB]?$/.test(line))
        .filter((line) => !/^\d+\s*(Reply|Replies|Repost|Reposts|Like|Likes|View|Views)$/i.test(line))
        .filter((line) => !/^·$/.test(line));

      return lines.join("\n").trim();
    }
  });
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
