import { readFile } from "node:fs/promises";

await loadDotEnvLocal();

const siteUrl = process.env.SITE_URL ?? "https://ai-3636.onrender.com";
const adminUser = process.env.ADMIN_USER;
const adminPassword = process.env.ADMIN_PASSWORD;
const ollamaUrl = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
const ollamaModel = process.env.OLLAMA_MODEL ?? "qwen2.5:7b-instruct";
const limit = Number(process.env.LOCAL_DRAFT_LIMIT ?? 10);

if (!adminUser || !adminPassword) {
  console.error("ADMIN_USER and ADMIN_PASSWORD are missing. Save them in .env.local.");
  process.exit(1);
}

const auth = `Basic ${Buffer.from(`${adminUser}:${adminPassword}`).toString("base64")}`;
const baseUrl = siteUrl.replace(/\/$/, "");
const candidates = await fetchCandidates();
const targets = candidates
  .filter((candidate) => candidate.postText?.trim())
  .filter((candidate) => !candidate.draftTitle || !candidate.draftSummary)
  .slice(0, limit);

if (targets.length === 0) {
  console.log("No candidates need local draft generation.");
  process.exit(0);
}

const ollamaReady = await canUseOllama();
console.log(
  `Generating local drafts for ${targets.length} candidates. ` +
    `Provider: ${ollamaReady ? `Ollama ${ollamaModel}` : "built-in fallback"}.`,
);

for (const candidate of targets) {
  const draft = ollamaReady
    ? await generateWithOllama(candidate).catch((error) => {
        console.warn(`Ollama failed for ${candidate.url}: ${error.message}`);
        return buildFallbackDraft(candidate);
      })
    : buildFallbackDraft(candidate);

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

async function canUseOllama() {
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
}

async function generateWithOllama(candidate) {
  const prompt = [
    "あなたは日本語のAIニュース編集者です。",
    "次のXポストから、一般読者にも分かる記事下書きをJSONだけで返してください。",
    "タイトルは具体的に。『AI活用の新しい選択肢に』のような汎用表現は禁止です。",
    "英語は自然な日本語に翻訳してください。ポストにない事実は作らないでください。",
    "",
    `投稿者: ${candidate.author}`,
    `URL: ${candidate.url}`,
    "",
    "Xポスト本文:",
    candidate.postText,
    "",
    'JSON形式: {"title":"...","summary":"...","translation":"...","body":["..."],"imagePrompt":"..."}',
  ].join("\n");

  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      format: "json",
      model: ollamaModel,
      options: {
        temperature: 0.4,
      },
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`status=${response.status}`);
  }

  const json = await response.json();
  const parsed = JSON.parse(json.response);
  return normalizeDraft(parsed, candidate);
}

function buildFallbackDraft(candidate) {
  const text = cleanupText(candidate.postText);
  const product = extractProductName(text) ?? prettifyAuthor(candidate.author);
  const topic = inferTopic(text);
  const action = inferAction(text);
  const title = `${product}の${topic}を整理、${action}のポイント`;
  const summary = [
    `${prettifyAuthor(candidate.author)}のXポストで、${product}に関する情報が紹介されています。`,
    `${topic}に関わる内容で、使い方や仕組みを確認する価値があります。`,
    "公開前に本文と事実関係を確認してください。",
  ].join("\n\n");

  return {
    body: [
      `${prettifyAuthor(candidate.author)}のXポストで、${product}に関する情報が紹介されています。`,
      "この投稿は、AIツールや開発ワークフローに関心がある読者に向けて整理しておきたい内容です。",
      "ここに元ポストを埋め込みます。",
      `今回のポイントは、${topic}に関する具体的な使い方や変化が分かる点です。`,
      "### なぜ重要なのか",
      "AI関連ツールは数が多く、何が実務で使えるのか分かりにくくなっています。",
      "こうした投稿を整理することで、読者は新しいツールや手法を試す前に要点をつかみやすくなります。",
      "### まとめ",
      `${product}については、元ポストの内容を確認しながら、導入方法や注意点を見ていく必要があります。`,
    ],
    imagePrompt: `Clean editorial AI news image about ${product}, ${topic}, modern technology style, no text, no logo.`,
    summary,
    title,
    translation: text,
  };
}

function normalizeDraft(draft, candidate) {
  const fallback = buildFallbackDraft(candidate);

  return {
    body: Array.isArray(draft.body) && draft.body.length ? draft.body : fallback.body,
    imagePrompt: String(draft.imagePrompt || fallback.imagePrompt).trim(),
    summary: String(draft.summary || fallback.summary).trim(),
    title: cleanupGenericTitle(String(draft.title || fallback.title).trim()),
    translation: String(draft.translation || fallback.translation).trim(),
  };
}

function cleanupText(value = "") {
  return value.replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
}

function extractProductName(text) {
  return (
    text.match(/[「『"]([^」』"]{2,40})[」』"]/)?.[1]?.trim() ??
    text.match(/\b(SPECA|Claude Code|Cursor|Codex|Gemini|ChatGPT|GPT-[A-Za-z0-9.-]+|Grok|Perplexity|NotebookLM|Ollama)\b/)?.[1] ??
    text.match(/\b[A-Z][A-Za-z0-9_.-]{2,30}\b/)?.[0]
  );
}

function inferTopic(text) {
  if (/code|codex|claude code|cursor|開発|コード/i.test(text)) return "AI開発ワークフロー";
  if (/agent|エージェント/i.test(text)) return "AIエージェント活用";
  if (/image|画像/i.test(text)) return "画像生成AI";
  if (/video|動画/i.test(text)) return "動画生成AI";
  if (/security|audit|脆弱|監査|仕様/i.test(text)) return "AIセキュリティ監査";
  if (/oss|open source|github|オープンソース/i.test(text)) return "オープンソースAIツール";
  return "AIツール活用";
}

function inferAction(text) {
  if (/release|released|公開|リリース/i.test(text)) return "公開";
  if (/how to|使い方|手順|方法/i.test(text)) return "使い方";
  if (/update|アップデート|新機能/i.test(text)) return "新機能";
  return "注目";
}

function prettifyAuthor(author) {
  return String(author)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^nyx foundation$/i, "Nyx Foundation");
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
