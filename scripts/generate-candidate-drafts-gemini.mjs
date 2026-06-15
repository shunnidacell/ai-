import { readFile } from "node:fs/promises";

await loadDotEnvLocal();

const siteUrl = process.env.SITE_URL ?? "https://ai-3636.onrender.com";
const adminUser = process.env.ADMIN_USER;
const adminPassword = process.env.ADMIN_PASSWORD;
const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiModel = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const limit = Number(process.env.DRAFT_GENERATION_LIMIT ?? 10);
const forceRegenerate = process.env.DRAFT_GENERATION_FORCE === "1";

if (!adminUser || !adminPassword) {
  console.error("ADMIN_USERとADMIN_PASSWORDを.env.localに設定してください。");
  process.exit(1);
}

if (!geminiApiKey) {
  console.error("GEMINI_API_KEYが設定されていません。");
  console.error("Google AI StudioでAPIキーを作成し、.env.localに保存してください。");
  process.exit(1);
}

const auth = `Basic ${Buffer.from(`${adminUser}:${adminPassword}`).toString("base64")}`;
const baseUrl = siteUrl.replace(/\/$/, "");
const candidates = await fetchCandidates();
const targets = candidates
  .filter((candidate) => candidate.postText?.trim())
  .filter(
    (candidate) =>
      forceRegenerate || !candidate.draftTitle || !candidate.draftSummary,
  )
  .slice(0, limit);

if (targets.length === 0) {
  console.log("記事生成が必要な候補はありません。");
  console.log("新しい候補がある場合は、先にXブックマークを同期してください。");
  process.exit(0);
}

let updatedCount = 0;
console.log(
  `${targets.length}件の記事をGemini ${geminiModel}で生成します。`,
);

if (forceRegenerate) {
  console.log("強制再生成モードです。既存の下書きも上書きします。");
}

for (const candidate of targets) {
  const draft = await generateWithGemini(candidate).catch((error) => {
    console.warn(`Gemini生成をスキップしました: ${candidate.url}`);
    console.warn(formatGeminiError(error));
    return null;
  });

  if (!draft) {
    continue;
  }

  const updated = await updateCandidateDraft(candidate.id, draft).catch(
    (error) => {
      console.warn(`下書きの保存をスキップしました: ${candidate.url}`);
      console.warn(error.message);
      return false;
    },
  );

  if (updated) {
    updatedCount += 1;
    console.log(`[生成完了] ${draft.title}`);
  }
}

console.log(`Gemini記事生成完了: ${updatedCount}/${targets.length}件`);

if (updatedCount === 0 && targets.length > 0) {
  process.exitCode = 1;
}

async function fetchCandidates() {
  const response = await fetch(`${baseUrl}/api/x-candidates`, {
    headers: { authorization: auth },
  });

  if (!response.ok) {
    throw new Error(`候補取得に失敗しました: ${response.status}`);
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
    throw new Error(`候補更新に失敗しました: ${response.status} ${text}`);
  }

  return true;
}

async function generateWithGemini(candidate) {
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(geminiModel)}:generateContent`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": geminiApiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: buildPrompt(candidate) }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          required: [
            "title",
            "summary",
            "translation",
            "body",
            "imagePrompt",
          ],
          properties: {
            title: { type: "string" },
            summary: { type: "string" },
            translation: { type: "string" },
            body: {
              type: "array",
              items: { type: "string" },
            },
            imagePrompt: { type: "string" },
          },
        },
        temperature: 0.55,
      },
      systemInstruction: {
        parts: [
          {
            text:
              "あなたは正確さと読みやすさを重視する日本語AIニュース編集者です。与えられた情報だけを基に記事を書き、指定されたJSONだけを返してください。",
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const error = new Error(`status=${response.status} ${text}`);
    error.status = response.status;
    throw error;
  }

  const json = await response.json();
  const blockReason = json.promptFeedback?.blockReason;

  if (blockReason) {
    throw new Error(`安全性判定により生成できませんでした: ${blockReason}`);
  }

  const text = (json.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  return normalizeDraft(parseModelJson(text));
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

    throw new Error("Geminiから有効なJSONが返りませんでした。");
  }
}

function buildPrompt(candidate) {
  return [
    "以下のXポストを情報源として、日本語のAIニュース記事の下書きを作成してください。",
    "",
    "執筆ルール:",
    "- 英語の投稿は自然な日本語に翻訳して説明する",
    "- 投稿にない価格、日付、数値、提携、性能、公式見解を推測で追加しない",
    "- 不明な内容は断定せず、投稿で確認できる範囲を明示する",
    "- タイトルには製品名、OSS名、機能名、具体的な変化のいずれかを含める",
    "- 「AI活用の新しい選択肢に」「〜が登場」のような汎用タイトルを使わない",
    "- 投稿ごとに最適な記事構成を考え、固定テンプレートにしない",
    "- 必要な場合だけ2〜5個の具体的な見出しを使う",
    "- 「なぜ重要なのか」「ポイント」「まとめ」だけの汎用見出しを避ける",
    "- body配列には通常段落と、先頭が「### 」の見出しを入れられる",
    "- 冒頭付近に「ここに元ポストを埋め込みます。」という段落を1つ入れる",
    "- summaryは記事一覧用として、2〜4段落の簡潔な説明にする",
    "- imagePromptは文字やロゴを含まないニュース画像生成用の英語プロンプトにする",
    "",
    `投稿者: ${candidate.author}`,
    `投稿URL: ${candidate.url}`,
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
    throw new Error("Geminiの記事データに不足があります。");
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
    .replace(/[、,\s]*AI活用の新しい選択肢に/g, "")
    .replace(/[、,\s]*AI活用の新たな選択肢に/g, "")
    .replace(/[、,\s]*AI活用の新しい可能性に/g, "")
    .replace(/[、,\s]*が登場$/g, "")
    .trim();
}

function formatGeminiError(error) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("429")) {
    return "Gemini無料枠の上限またはレート制限に達しました。時間を置いて再実行してください。";
  }

  if (message.includes("400")) {
    return `Geminiへのリクエストが無効です。モデル名を確認してください。${message}`;
  }

  if (message.includes("401") || message.includes("403")) {
    return "GEMINI_API_KEYが無効、またはこのモデルを利用できません。";
  }

  return message;
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
