import { readFile } from "node:fs/promises";

await loadDotEnvLocal();

const siteUrl = process.env.SITE_URL ?? "https://ai-3636.onrender.com";
const adminUser = process.env.ADMIN_USER;
const adminPassword = process.env.ADMIN_PASSWORD;
const ollamaUrl = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
const ollamaModel = process.env.OLLAMA_MODEL ?? "gpt-oss:20b";
const limit = Number(process.env.LOCAL_DRAFT_LIMIT ?? 10);

if (!adminUser || !adminPassword) {
  console.error("ADMIN_USER and ADMIN_PASSWORD are missing. Save them in .env.local.");
  process.exit(1);
}

const auth = `Basic ${Buffer.from(`${adminUser}:${adminPassword}`).toString("base64")}`;
const baseUrl = siteUrl.replace(/\/$/, "");
const ollamaState = await getOllamaState();

if (!ollamaState.ready) {
  console.log(`Ollama is not ready: ${ollamaState.reason}`);
  console.log("Start Ollama, then run npm run generate:drafts:local again.");
  process.exit(0);
}

const candidates = await fetchCandidates();
const targets = candidates
  .filter((candidate) => candidate.postText?.trim())
  .filter((candidate) => !candidate.draftTitle || !candidate.draftSummary)
  .slice(0, limit);

if (targets.length === 0) {
  console.log("No candidates need local draft generation.");
  console.log("If you expected new drafts, run npm run sync:bookmarks:chrome first.");
  process.exit(0);
}

let updatedCount = 0;
console.log(`Generating local drafts for ${targets.length} candidates with Ollama ${ollamaModel}.`);

for (const candidate of targets) {
  const draft = await generateWithOllama(candidate).catch((error) => {
    console.warn(`Ollama generation failed. Skipped: ${candidate.url}`);
    console.warn(error.message);
    return null;
  });

  if (!draft) {
    continue;
  }

  const updated = await updateCandidateDraft(candidate.id, draft).catch((error) => {
    console.warn(`Draft update failed. Skipped: ${candidate.url}`);
    console.warn(error.message);
    return false;
  });

  if (updated) {
    updatedCount += 1;
    console.log(`[draft] ${draft.title}`);
  }
}

console.log(`Local draft generation finished. Updated: ${updatedCount}/${targets.length}.`);

async function fetchCandidates() {
  const response = await fetch(`${baseUrl}/api/x-candidates`, {
    headers: { authorization: auth },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch candidates: ${response.status}`);
  }

  const json = await response.json();
  return json.candidates ?? [];
}

async function updateCandidateDraft(id, draft) {
  const response = await fetch(`${baseUrl}/api/x-candidates`, {
    method: "PATCH",
    headers: {
      authorization: auth,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      id,
      draft: {
        body: draft.body.join("\n\n"),
        imagePrompt: draft.imagePrompt,
        summary: draft.summary,
        title: draft.title,
        translation: draft.translation,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Failed to update candidate: ${response.status} ${text}`);
  }

  return true;
}

async function getOllamaState() {
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`);

    if (!response.ok) {
      return { ready: false, reason: `status=${response.status}` };
    }

    const json = await response.json();
    const models = (json.models ?? []).map((model) => model.name);

    if (!models.includes(ollamaModel)) {
      return {
        ready: false,
        reason: `${ollamaModel} was not found. Available models: ${models.join(", ") || "none"}`,
      };
    }

    return { ready: true };
  } catch (error) {
    return {
      ready: false,
      reason: error instanceof Error ? error.message : "Could not connect to Ollama.",
    };
  }
}

async function generateWithOllama(candidate) {
  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      format: "json",
      messages: [
        {
          role: "system",
          content:
            "You are a Japanese AI news editor. Return only valid JSON in the requested schema.",
        },
        {
          role: "user",
          content: buildPrompt(candidate),
        },
      ],
      model: ollamaModel,
      options: {
        temperature: 0.35,
      },
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`status=${response.status}`);
  }

  const json = await response.json();
  const parsed = parseModelJson(json.message?.content ?? json.response);
  return normalizeDraft(parsed);
}

function parseModelJson(value) {
  const text = String(value ?? "").trim();

  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }

    throw new Error("Ollama did not return JSON.");
  }
}

function buildPrompt(candidate) {
  return [
    "Write a Japanese AI news article draft from the following X post.",
    "The output language must be natural Japanese.",
    "If the post is English, translate and explain it in Japanese.",
    "Do not invent prices, dates, benchmark numbers, partnerships, or official facts that are not in the post.",
    "Use a specific title. Include the service name, OSS name, feature name, or what changed.",
    "Never use generic titles like 'AI katsuyo no atarashii sentakushi ni' or 'AI utilization gets a new option'.",
    "Return valid JSON only. No markdown. No commentary.",
    "",
    "Required JSON schema:",
    '{"title":"specific Japanese title","summary":"2 to 4 short Japanese paragraphs for the article card","translation":"Japanese translation for English posts, or a Japanese source memo for Japanese posts","body":["lead paragraph","ここに元ポストを埋め込みます。","explanation below the embedded X post","### なぜ重要なのか","plain explanation","### まとめ","closing summary"],"imagePrompt":"English prompt for a clean editorial AI news image. No text, no logo."}',
    "",
    `Author: ${candidate.author}`,
    `URL: ${candidate.url}`,
    "",
    "X post text:",
    cleanupText(candidate.postText),
  ].join("\n");
}

function normalizeDraft(draft) {
  const body = Array.isArray(draft.body)
    ? draft.body.map((paragraph) => String(paragraph).trim()).filter(Boolean)
    : [];

  if (
    !draft.title ||
    !draft.summary ||
    !draft.translation ||
    body.length === 0 ||
    !draft.imagePrompt
  ) {
    throw new Error("Ollama returned incomplete article JSON.");
  }

  return {
    body,
    imagePrompt: String(draft.imagePrompt).trim(),
    summary: String(draft.summary).trim(),
    title: cleanupGenericTitle(String(draft.title).trim()),
    translation: String(draft.translation).trim(),
  };
}

function cleanupText(value = "") {
  return value.replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
}

function cleanupGenericTitle(title) {
  return title
    .replace(/、?AI活用の新しい選択肢に/g, "")
    .replace(/、?AI活用の新たな選択肢に/g, "")
    .replace(/、?AI活用の新しい可能性に/g, "")
    .replace(/が登場$/g, "")
    .trim();
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

    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalIndex = trimmed.indexOf("=");
    if (equalIndex <= 0) continue;

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
