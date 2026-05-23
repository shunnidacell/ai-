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
          "A specific Japanese article title based on the post. Avoid generic AI-news titles.",
      },
      summary: {
        type: "string",
        description:
          "Japanese card description. Use 2 to 4 short paragraphs separated by blank lines.",
      },
      translation: {
        type: "string",
        description:
          "Japanese translation for English posts, or a compact Japanese source memo for Japanese posts.",
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
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey || !postText.trim()) {
    return null;
  }

  for (const model of getArticleModels()) {
    const draft = await generateWithResponsesApi({
      apiKey,
      author,
      model,
      postText,
      postUrl,
    });

    if (draft) {
      return draft;
    }
  }

  return null;
}

async function generateWithResponsesApi({
  apiKey,
  author,
  model,
  postText,
  postUrl,
}: GenerateArticleDraftInput & { apiKey: string; model: string }) {
  try {
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
        `OpenAI article generation failed with ${model}: ${response.status} ${detail.slice(0, 500)}`,
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

    if (!isValidDraft(parsed)) {
      return null;
    }

    return sanitizeDraft(parsed);
  } catch (error) {
    console.error(
      error instanceof Error
        ? `OpenAI article generation error with ${model}: ${error.message}`
        : `OpenAI article generation error with ${model}.`,
    );
    return null;
  }
}

function getArticleModels() {
  const configured = process.env.OPENAI_ARTICLE_MODEL
    ?.split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  if (configured?.length) {
    return configured;
  }

  return ["gpt-4.1", "gpt-4.1-mini", "gpt-4o-mini"];
}

function buildSystemPrompt() {
  return [
    "あなたは日本語のAIニュースサイト編集者です。",
    "Xポストを読み、一般読者にも分かる自然なニュース記事の下書きを作ります。",
    "英語のポストは必ず自然な日本語へ翻訳してから記事化します。",
    "タイトルは内容固有にしてください。サービス名、OSS名、機能名、何が新しいのかが分かるタイトルにします。",
    "『AI活用の新しい選択肢に』『登場、AI活用の新しい選択肢に』のような汎用タイトルは禁止です。",
    "ポスト本文にない価格、日付、性能値、提携、公式発表の事実を作らないでください。",
    "記事には、冒頭リード、元ポスト下に置く説明、分かりやすい補足、続きを読みたくなる段落、まとめを含めます。",
    "断定しすぎず、ポストから分かる範囲と推測を分けて書きます。",
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
    "- title: 内容固有の日本語タイトル。読者が何の記事か分かるようにする。",
    "- summary: 記事一覧カード用の説明文。2から4段落。",
    "- translation: 英語なら自然な日本語訳。日本語なら要点メモ。",
    "- body: 記事本文。見出しは '### なぜ重要なのか' のように書く。",
    "- imagePrompt: タイトル画像生成用の英語プロンプト。文字やロゴは入れない。",
  ].join("\n");
}

function isValidDraft(draft: CandidateDraft) {
  return Boolean(
    draft?.title &&
      draft.summary &&
      draft.translation &&
      Array.isArray(draft.body) &&
      draft.body.length > 0 &&
      draft.imagePrompt,
  );
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
    .replace(/が登場$/g, "")
    .trim();
}
