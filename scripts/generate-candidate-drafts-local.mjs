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
  console.log(`Ollama未起動: ${ollamaState.reason}`);
  console.log("Ollamaを起動してから npm run generate:drafts:local を実行してください。");
  process.exit(0);
}

const candidates = await fetchCandidates();
const targets = candidates
  .filter((candidate) => candidate.postText?.trim())
  .filter((candidate) => !candidate.draftTitle || !candidate.draftSummary)
  .slice(0, limit);

if (targets.length === 0) {
  console.log("No candidates need local draft generation.");
  process.exit(0);
}

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

  await updateCandidateDraft(candidate.id, draft);
  console.log(`[draft] ${draft.title}`);
}

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
        reason: `${ollamaModel} が見つかりません。現在のモデル: ${models.join(", ") || "なし"}`,
      };
    }

    return { ready: true };
  } catch (error) {
    return {
      ready: false,
      reason: error instanceof Error ? error.message : "Ollamaに接続できません。",
    };
  }
}

async function generateWithOllama(candidate) {
  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      format: "json",
      model: ollamaModel,
      options: {
        temperature: 0.35,
      },
      prompt: buildPrompt(candidate),
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`status=${response.status}`);
  }

  const json = await response.json();
  const parsed = JSON.parse(json.response);
  return normalizeDraft(parsed);
}

function buildPrompt(candidate) {
  return [
    "あなたは日本語のAIニュースサイト編集者です。",
    "次のXポストを読み、一般読者にも分かる自然な記事下書きを作ってください。",
    "英語の投稿は自然な日本語に翻訳してから記事化してください。",
    "タイトルは具体的にしてください。サービス名、OSS名、機能名、何が新しいのかが分かるタイトルにします。",
    "『AI活用の新しい選択肢に』『登場、AI活用の新しい選択肢に』のような汎用タイトルは禁止です。",
    "ポスト本文にない価格、日付、性能値、提携、公式発表の事実を作らないでください。",
    "断定しすぎず、ポストから分かる範囲と推測を分けて書いてください。",
    "必ずJSONだけを返してください。",
    "",
    "必要なJSON形式:",
    '{"title":"記事タイトル","summary":"記事一覧カード用の説明文。2から4段落","translation":"英語なら日本語訳。日本語なら要点メモ","body":["冒頭リード","ここに元ポストを埋め込みます。","元ポスト下に置く説明","### なぜ重要なのか","補足説明","### まとめ","まとめ文"],"imagePrompt":"English prompt for a clean editorial AI news image. No text, no logo."}',
    "",
    `投稿者: ${candidate.author}`,
    `URL: ${candidate.url}`,
    "",
    "Xポスト本文:",
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
