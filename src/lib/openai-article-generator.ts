import type { CandidateDraft } from "@/lib/x-candidates";

type GenerateArticleDraftInput = {
  author: string;
  postText: string;
  postUrl: string;
};

const articleDraftSchema = {
  name: "x_article_draft",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["title", "summary", "translation", "body", "imagePrompt"],
    properties: {
      title: {
        type: "string",
        description:
          "A specific Japanese article title based on the post. Never use generic endings.",
      },
      summary: {
        type: "string",
        description:
          "Japanese card description. Use 2 to 4 short paragraphs separated by blank lines.",
      },
      translation: {
        type: "string",
        description:
          "Japanese translation for English posts, or a Japanese memo for Japanese posts.",
      },
      body: {
        type: "array",
        minItems: 8,
        maxItems: 18,
        items: { type: "string" },
        description:
          "Japanese article paragraphs. Use strings beginning with '### ' for section headings.",
      },
      imagePrompt: {
        type: "string",
        description: "English prompt for a clean editorial AI news image. No text.",
      },
    },
  },
  strict: true,
};

export async function generateArticleDraftWithOpenAI({
  author,
  postText,
  postUrl,
}: GenerateArticleDraftInput): Promise<CandidateDraft | null> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || !postText.trim()) {
    return null;
  }

  const models = getArticleModels();

  try {
    for (const model of models) {
      const draft = await generateWithModel({ apiKey, author, model, postText, postUrl });

      if (draft) {
        return draft;
      }
    }

    return null;
  } catch (error) {
    console.error(
      error instanceof Error
        ? `OpenAI article generation error: ${error.message}`
        : "OpenAI article generation error.",
    );
    return null;
  }
}

async function generateWithModel({
  apiKey,
  author,
  model,
  postText,
  postUrl,
}: GenerateArticleDraftInput & { apiKey: string; model: string }) {
  const responsesDraft = await generateWithResponsesApi({
    apiKey,
    author,
    model,
    postText,
    postUrl,
  });

  if (responsesDraft) {
    return responsesDraft;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(),
          },
          {
            role: "user",
            content: buildUserPrompt({ author, postText, postUrl }),
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: articleDraftSchema,
        },
      }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(
      `OpenAI article generation failed with ${model}: ${response.status} ${detail.slice(0, 500)}`,
    );
    return null;
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;

  if (!content) {
    return null;
  }

  const parsed = JSON.parse(content) as CandidateDraft;

  if (
    !parsed.title ||
    !parsed.summary ||
    !parsed.translation ||
    !Array.isArray(parsed.body) ||
    parsed.body.length === 0 ||
    !parsed.imagePrompt
  ) {
    return null;
  }

  return sanitizeDraft(parsed);
}

async function generateWithResponsesApi({
  apiKey,
  author,
  model,
  postText,
  postUrl,
}: GenerateArticleDraftInput & { apiKey: string; model: string }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions: buildSystemPrompt(),
      input: buildUserPrompt({ author, postText, postUrl }),
      text: {
        format: {
          type: "json_schema",
          name: articleDraftSchema.name,
          schema: articleDraftSchema.schema,
          strict: articleDraftSchema.strict,
        },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(
      `OpenAI Responses generation failed with ${model}: ${response.status} ${detail.slice(0, 500)}`,
    );
    return null;
  }

  const json = (await response.json()) as {
    output?: Array<{
      content?: Array<{ text?: string; type?: string }>;
      type?: string;
    }>;
    output_text?: string;
  };
  const content =
    json.output_text ??
    json.output
      ?.flatMap((item) => item.content ?? [])
      .map((contentItem) => contentItem.text)
      .filter(Boolean)
      .join("");

  if (!content) {
    return null;
  }

  const parsed = JSON.parse(content) as CandidateDraft;

  if (
    !parsed.title ||
    !parsed.summary ||
    !parsed.translation ||
    !Array.isArray(parsed.body) ||
    parsed.body.length === 0 ||
    !parsed.imagePrompt
  ) {
    return null;
  }

  return sanitizeDraft(parsed);
}

function getArticleModels() {
  const configured = process.env.OPENAI_ARTICLE_MODEL
    ?.split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  if (configured?.length) {
    return configured;
  }

  return ["gpt-5.5", "gpt-5.4", "gpt-5.4-mini", "gpt-5.2", "gpt-5.1", "gpt-4.1"];
}

function buildSystemPrompt() {
  return [
    "あなたは日本語のAIニュースサイト編集者です。",
    "Xポストを読み、一般読者にも分かる自然な記事下書きを作ります。",
    "英語ポストは必ず自然な日本語へ翻訳・要約してから記事化します。",
    "タイトルは内容固有にしてください。",
    "絶対に『AI活用の新しい選択肢に』『登場、AI活用の新しい選択肢に』のような汎用タイトルを使わないでください。",
    "ポスト本文にない価格、日付、性能値、提携、公式発表の事実は作らないでください。",
    "記事は、冒頭リード、元ポスト下に置く説明、分かりやすい補足、続きを読みたくなる段落、まとめを含めます。",
  ].join("\n");
}

function buildUserPrompt({
  author,
  postText,
  postUrl,
}: GenerateArticleDraftInput) {
  return [
    "次のXポストから記事下書きを作ってください。",
    "",
    `投稿者: ${author}`,
    `URL: ${postUrl}`,
    "",
    "Xポスト本文:",
    postText,
    "",
    "出力条件:",
    "- title: 具体的な日本語タイトル。内容を読めば何の記事か分かるようにする。",
    "- summary: 記事一覧カード用の説明文。2から4段落。",
    "- translation: 英語なら自然な日本語訳。日本語なら内容メモ。",
    "- body: 記事本文。小見出しは '### なぜ重要なのか' のように書く。",
    "- imagePrompt: タイトル画像生成用の英語プロンプト。",
  ].join("\n");
}

function sanitizeDraft(draft: CandidateDraft): CandidateDraft {
  return {
    body: draft.body.map((paragraph) => paragraph.trim()).filter(Boolean),
    imagePrompt: draft.imagePrompt.trim(),
    summary: draft.summary.trim(),
    title: removeGenericTitleEnding(draft.title.trim()),
    translation: draft.translation.trim(),
  };
}

function removeGenericTitleEnding(title: string) {
  return title
    .replace(/、?AI活用の新しい選択肢に/g, "")
    .replace(/、?AI活用の新たな選択肢に/g, "")
    .replace(/、?AI活用の新しい可能性に/g, "")
    .trim();
}
