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
        description: "A natural Japanese news/article title. Do not use generic endings.",
      },
      summary: {
        type: "string",
        description: "Card description in Japanese. 2 to 4 short paragraphs separated by blank lines.",
      },
      translation: {
        type: "string",
        description: "Japanese translation or Japanese content memo of the source X post.",
      },
      body: {
        type: "array",
        minItems: 8,
        maxItems: 18,
        items: {
          type: "string",
        },
        description:
          "Article paragraphs in Japanese. Use strings beginning with '### ' for section headings.",
      },
      imagePrompt: {
        type: "string",
        description: "English prompt for a clean editorial AI news image. No text in image.",
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

  const model = process.env.OPENAI_ARTICLE_MODEL ?? "gpt-5.5";

  try {
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
            content: [
              "あなたは日本語のAIニュースサイト編集者です。",
              "Xポストを読み、一般読者にも分かる自然な記事下書きを作ります。",
              "英語ポストは必ず自然な日本語に翻訳・要約してから記事化します。",
              "タイトルは内容固有にしてください。『AI活用の新しい選択肢に』のような汎用句を使わないでください。",
              "事実を断定しすぎず、元ポストで分かる範囲と確認が必要な範囲を分けてください。",
              "本文は、冒頭リード、元ポスト下に置く説明、分かりやすい補足、続きを読みたくなる段落、まとめを含めます。",
              "ポスト本文にない固有情報、価格、日付、性能値、提携情報は作らないでください。",
            ].join("\n"),
          },
          {
            role: "user",
            content: [
              "次のXポストから記事下書きを作ってください。",
              "",
              `投稿者: ${author}`,
              `URL: ${postUrl}`,
              "",
              "Xポスト本文:",
              postText,
              "",
              "出力の条件:",
              "- title: 記事タイトル。具体的で、ポスト内容を反映する。",
              "- summary: 記事一覧カード用の説明文。2から4段落。",
              "- translation: 英語なら日本語訳。日本語なら内容メモ。",
              "- body: 記事本文。必要なら '### なぜ重要なのか' のような小見出しを入れる。",
              "- imagePrompt: タイトル画像生成用の英語プロンプト。",
            ].join("\n"),
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: articleDraftSchema,
        },
      }),
    });

    if (!response.ok) {
      console.error(`OpenAI article generation failed: ${response.status}`);
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

    return {
      body: parsed.body.map((paragraph) => paragraph.trim()).filter(Boolean),
      imagePrompt: parsed.imagePrompt.trim(),
      summary: parsed.summary.trim(),
      title: parsed.title.trim(),
      translation: parsed.translation.trim(),
    };
  } catch (error) {
    console.error(
      error instanceof Error
        ? `OpenAI article generation error: ${error.message}`
        : "OpenAI article generation error.",
    );
    return null;
  }
}
