import { promises as fs } from "node:fs";
import path from "node:path";
import { readJsonFromDb, writeJsonToDb } from "@/lib/db-store";

export type CandidateDecision = "draft" | "published" | "headline" | "rejected";

export type XPostCandidate = {
  id: string;
  url: string;
  author: string;
  statusId: string;
  sourceType: "official" | "developer" | "unknown";
  articleWorthy: boolean;
  reason: string;
  createdAt: string;
  decision?: CandidateDecision;
  decidedAt?: string;
  deletedAt?: string;
  draftTitle?: string;
  draftTranslation?: string;
  draftSummary?: string;
  draftBody?: string[];
  draftImagePrompt?: string;
  imageOverride?: string;
  postImageUrl?: string;
  postText?: string;
};

export type CandidateDraft = {
  title: string;
  translation: string;
  summary: string;
  body: string[];
  imagePrompt: string;
};

export type CandidateMeta = {
  postImageUrl?: string;
  postText?: string;
};

type ArticleSeed = {
  action: string;
  authorLabel: string;
  domainLabel: string;
  featureLabel: string;
  isOss: boolean;
  isSecuritySpecTool: boolean;
  product: string;
  translatedText: string;
};

const officialAccounts = new Set([
  "OpenAI",
  "OpenAIDevs",
  "AnthropicAI",
  "claudeai",
  "GoogleAI",
  "xai",
  "MetaAI",
  "MistralAI",
  "perplexity_ai",
]);

const developerAccounts = new Set([
  "OpenAIDevs",
  "AnthropicDocs",
  "GoogleWorkspace",
  "vercel",
  "LangChainAI",
]);

const storePath = path.join(process.cwd(), "data", "x-post-candidates.json");
const storeKey = "x-post-candidates";

export async function readCandidates() {
  const dbCandidates = await readJsonFromDb<XPostCandidate[]>(storeKey);

  if (dbCandidates) {
    return dbCandidates;
  }

  try {
    const raw = (await fs.readFile(storePath, "utf8")).replace(/^\uFEFF/, "");
    return JSON.parse(raw) as XPostCandidate[];
  } catch {
    return [];
  }
}

export async function writeCandidates(candidates: XPostCandidate[]) {
  if (await writeJsonToDb(storeKey, candidates)) {
    return;
  }

  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(candidates, null, 2), "utf8");
}

export function getCandidateTimestamp(candidate: XPostCandidate) {
  return Date.parse(candidate.decidedAt ?? candidate.createdAt);
}

export function sortCandidatesByNewest<T extends XPostCandidate>(candidates: T[]) {
  return [...candidates].sort(
    (a, b) => getCandidateTimestamp(b) - getCandidateTimestamp(a),
  );
}

export function getPublicCandidates(candidates: XPostCandidate[]) {
  return sortCandidatesByNewest(
    candidates.filter(
      (candidate) =>
        !candidate.deletedAt &&
        (candidate.decision === "published" || candidate.decision === "headline"),
    ),
  );
}

export function getHeadlineCandidates(candidates: XPostCandidate[]) {
  return sortCandidatesByNewest(
    candidates.filter(
      (candidate) => !candidate.deletedAt && candidate.decision === "headline",
    ),
  ).slice(0, 5);
}

export function getDeletedCandidates(candidates: XPostCandidate[]) {
  return sortCandidatesByNewest(
    candidates.filter((candidate) => Boolean(candidate.deletedAt)),
  );
}

export function parseXPostUrl(input: string) {
  const url = new URL(input);
  const host = url.hostname.replace(/^www\./, "");

  if (host !== "x.com" && host !== "twitter.com") {
    throw new Error("XのポストURLではありません。");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  const statusIndex = parts.findIndex((part) => part === "status");
  const author = parts[0];
  const statusId = statusIndex >= 0 ? parts[statusIndex + 1] : "";

  if (!author || !statusId || !/^\d+$/.test(statusId)) {
    throw new Error("ポストURLから投稿IDを読み取れません。");
  }

  return {
    author,
    canonicalUrl: `https://x.com/${author}/status/${statusId}`,
    statusId,
  };
}

export function classifyCandidate(author: string) {
  if (officialAccounts.has(author)) {
    return {
      articleWorthy: true,
      reason: "公式アカウントのポストです。内容を確認して記事化できます。",
      sourceType: "official" as const,
    };
  }

  if (developerAccounts.has(author)) {
    return {
      articleWorthy: true,
      reason: "開発者または関連アカウントのポストです。内容を確認して記事化できます。",
      sourceType: "developer" as const,
    };
  }

  return {
    articleWorthy: true,
    reason: "個人または未分類アカウントです。実用性やニュース性を確認してから公開してください。",
    sourceType: "unknown" as const,
  };
}

export function buildCandidateDraft(candidate: XPostCandidate): CandidateDraft {
  const postText = normalizePostText(candidate.postText);
  const hasSavedDraft = Boolean(
    candidate.draftTitle ||
      candidate.draftSummary ||
      candidate.draftTranslation ||
      candidate.draftBody?.length,
  );
  const hasGenericSavedTitle = isGenericDraftTitle(candidate.draftTitle);

  if (postText && (!hasSavedDraft || hasGenericSavedTitle)) {
    return emptyCandidateDraft();
  }

  if (!postText) {
    return {
      body: candidate.draftBody?.length
        ? candidate.draftBody
        : [],
      imagePrompt:
        candidate.draftImagePrompt ??
        "",
      summary: candidate.draftSummary ?? "",
      title: candidate.draftTitle ?? "",
      translation: candidate.draftTranslation ?? "",
    };
  }

  const seed = buildArticleSeed(postText, candidate.author);
  const auto = buildArticleDraftFromSeed(seed, postText);

  return {
    body: candidate.draftBody?.length ? candidate.draftBody : auto.body,
    imagePrompt:
      candidate.draftImagePrompt ??
      `Clean editorial AI news image about ${seed.product}, ${seed.domainLabel}, bright technology style, no text.`,
    summary: candidate.draftSummary ?? auto.summary,
    title: cleanupGenericTitle(candidate.draftTitle ?? auto.title),
    translation: candidate.draftTranslation ?? seed.translatedText,
  };
}

export function getCandidateImage(candidate: XPostCandidate) {
  const promptImage = getCandidateGeneratedImage(candidate);

  return (
    candidate.imageOverride ??
    promptImage ??
    candidate.postImageUrl ??
    `/api/x-candidates/${encodeURIComponent(candidate.id)}/image.svg`
  );
}

function getCandidateGeneratedImage(candidate: XPostCandidate) {
  if (!candidate.draftImagePrompt?.trim()) {
    return null;
  }

  const prompt = [
    candidate.draftImagePrompt,
    "editorial AI news image",
    "high quality",
    "no text",
    "no logo",
  ].join(", ");
  const seed = encodeURIComponent(candidate.statusId);

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1200&height=675&seed=${seed}&nologo=true&enhance=true`;
}

export async function registerCandidate(inputUrl: string, meta?: CandidateMeta) {
  const parsed = parseXPostUrl(inputUrl);
  const classification = classifyCandidate(parsed.author);
  const candidates = await readCandidates();
  const existing = candidates.find(
    (candidate) => candidate.statusId === parsed.statusId,
  );

  if (existing) {
    const nextMeta = {
      postImageUrl: meta?.postImageUrl?.trim() || existing.postImageUrl,
      postText: meta?.postText?.trim() || existing.postText,
    };
    const shouldUpdate =
      nextMeta.postImageUrl !== existing.postImageUrl ||
      nextMeta.postText !== existing.postText;

    if (shouldUpdate) {
      const next = candidates.map((candidate) =>
        candidate.statusId === parsed.statusId
          ? { ...candidate, ...nextMeta }
          : candidate,
      );
      await writeCandidates(next);
      return {
        candidate: next.find((candidate) => candidate.statusId === parsed.statusId),
        created: false,
        updated: true,
      };
    }

    return { candidate: existing, created: false, updated: false };
  }

  const candidate: XPostCandidate = {
    id: `${parsed.author}-${parsed.statusId}`,
    url: parsed.canonicalUrl,
    author: parsed.author,
    statusId: parsed.statusId,
    decision: "draft",
    ...classification,
    createdAt: new Date().toISOString(),
    postImageUrl: meta?.postImageUrl?.trim() || undefined,
    postText: meta?.postText?.trim() || undefined,
  };

  candidates.unshift(candidate);
  await writeCandidates(candidates);

  return { candidate, created: true, updated: false };
}

function draftToCandidateFields(draft: CandidateDraft | null) {
  if (!draft) {
    return {};
  }

  return {
    draftBody: draft.body,
    draftImagePrompt: draft.imagePrompt,
    draftSummary: draft.summary,
    draftTitle: cleanupGenericTitle(draft.title),
    draftTranslation: draft.translation,
  };
}

export async function updateCandidateDecision(
  id: string,
  decision: CandidateDecision,
) {
  const candidates = await readCandidates();
  const decidedAt = new Date().toISOString();
  let next = candidates.map((candidate) =>
    candidate.id === id ? { ...candidate, decision, decidedAt } : candidate,
  );

  if (decision === "headline") {
    const headlines = sortCandidatesByNewest(
      next.filter((candidate) => candidate.decision === "headline"),
    );
    const overflowIds = new Set(
      headlines.slice(5).map((candidate) => candidate.id),
    );

    next = next.map((candidate) =>
      overflowIds.has(candidate.id)
        ? { ...candidate, decision: "published" as const }
        : candidate,
    );
  }

  await writeCandidates(next);
  return { candidates: next };
}

export async function updateCandidateDraft(
  id: string,
  draft: {
    body?: string;
    imageOverride?: string;
    imagePrompt?: string;
    postImageUrl?: string;
    postText?: string;
    summary?: string;
    title?: string;
    translation?: string;
  },
) {
  const candidates = await readCandidates();
  const next = candidates.map((candidate) => {
    if (candidate.id !== id) {
      return candidate;
    }

    return {
      ...candidate,
      draftBody:
        draft.body === undefined
          ? candidate.draftBody
          : draft.body
              .split(/\n{2,}/)
              .map((paragraph) => paragraph.trim())
              .filter(Boolean),
      draftImagePrompt:
        draft.imagePrompt === undefined
          ? candidate.draftImagePrompt
          : draft.imagePrompt.trim() || undefined,
      draftSummary:
        draft.summary === undefined
          ? candidate.draftSummary
          : draft.summary.trim() || undefined,
      draftTitle:
        draft.title === undefined
          ? candidate.draftTitle
          : cleanupGenericTitle(draft.title.trim()) || undefined,
      draftTranslation:
        draft.translation === undefined
          ? candidate.draftTranslation
          : draft.translation.trim() || undefined,
      imageOverride:
        draft.imageOverride === undefined
          ? candidate.imageOverride
          : draft.imageOverride.trim() || undefined,
      postImageUrl:
        draft.postImageUrl === undefined
          ? candidate.postImageUrl
          : draft.postImageUrl.trim() || undefined,
      postText:
        draft.postText === undefined
          ? candidate.postText
          : draft.postText.trim() || undefined,
    };
  });

  await writeCandidates(next);
  return { candidates: next };
}

export async function regenerateCandidateDraft(id: string) {
  const candidates = await readCandidates();
  const candidate = candidates.find((item) => item.id === id);

  if (!candidate) {
    throw new Error("Candidate was not found.");
  }

  if (!candidate.postText?.trim()) {
    throw new Error("X post text is missing.");
  }

  throw new Error(
    "Gemini article generation runs from the manual controls on the candidates page.",
  );
}
export async function deleteCandidate(id: string) {
  const candidates = await readCandidates();
  const deletedAt = new Date().toISOString();
  const next = candidates.map((candidate) =>
    candidate.id === id ? { ...candidate, deletedAt } : candidate,
  );
  await writeCandidates(next);

  return {
    deleted: next.some((candidate) => candidate.id === id && candidate.deletedAt),
    candidates: next,
  };
}

export async function restoreCandidate(id: string) {
  const candidates = await readCandidates();
  const next = candidates.map((candidate) =>
    candidate.id === id ? { ...candidate, deletedAt: undefined } : candidate,
  );
  await writeCandidates(next);
  return { candidates: next, restored: true };
}

export async function purgeCandidate(id: string) {
  const candidates = await readCandidates();
  const next = candidates.filter((candidate) => candidate.id !== id);
  await writeCandidates(next);
  return { candidates: next, purged: next.length !== candidates.length };
}

function normalizePostText(value?: string) {
  return value
    ?.replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildArticleSeed(postText: string, author: string): ArticleSeed {
  const product = extractProductName(postText) ?? prettifyAuthor(author);
  const translatedText = translatePostTextForDraft(postText, product);
  const lower = postText.toLowerCase();
  const isOss =
    /oss|open source|open-source|github|公開|オープンソース/i.test(postText);
  const isSecuritySpecTool =
    /spec|specification|仕様|audit|security|監査|bug|bugs|vulnerability|脆弱/i.test(
      postText,
    );

  return {
    action: isOss ? "OSS公開" : detectAction(postText),
    authorLabel: prettifyAuthor(author),
    domainLabel: isSecuritySpecTool
      ? "AIセキュリティ監査"
      : lower.includes("agent") || postText.includes("エージェント")
        ? "AIエージェント活用"
        : inferDomainLabel(postText),
    featureLabel: isSecuritySpecTool
      ? "仕様書に書かれたルールをもとに、実装とのズレを検出する仕組み"
      : inferFeatureLabel(postText),
    isOss,
    isSecuritySpecTool,
    product,
    translatedText,
  };
}

function buildArticleDraftFromSeed(seed: ArticleSeed, originalPostText: string) {
  const title = seed.isSecuritySpecTool
    ? `コードではなく「仕様書」からバグを探すAI監査ツール、${seed.product}が${seed.action}`
    : buildSpecificFallbackTitle(seed, originalPostText);

  const summary = [
    `${seed.authorLabel}が、${seed.domainLabel}に関する「${seed.product}」を${seed.action}しました。`,
    `${seed.product}は、${seed.featureLabel}です。`,
    `${seed.domainLabel}の実務的な使い方を考えるうえで注目されます。`,
  ].join("\n\n");

  const body = seed.isSecuritySpecTool
    ? buildSecuritySpecBody(seed)
    : buildGeneralToolBody(seed);

  if (isLikelyEnglish(originalPostText)) {
    body.splice(3, 0, `原文の要点: ${seed.translatedText}`);
  }

  return { body, summary, title: cleanupGenericTitle(title) };
}

function buildSpecificFallbackTitle(seed: ArticleSeed, postText: string) {
  const lower = postText.toLowerCase();

  if (/codex|claude code|cursor/i.test(postText)) {
    return `${seed.product}関連の開発ワークフローを整理、AIコーディング活用の実例として注目`;
  }

  if (/chatgpt|gpt/i.test(postText)) {
    return `${seed.product}の使い方を整理、日常業務や制作で試したいポイント`;
  }

  if (lower.includes("agent") || postText.includes("エージェント")) {
    return `${seed.product}でAIエージェント活用を整理、作業自動化の実例として注目`;
  }

  if (lower.includes("image") || postText.includes("画像")) {
    return `${seed.product}の画像AI活用を整理、制作ワークフローへの影響に注目`;
  }

  if (lower.includes("video") || postText.includes("動画")) {
    return `${seed.product}の動画AI活用を整理、生成ワークフローへの影響に注目`;
  }

  return `${seed.product}の使い方を整理、${seed.domainLabel}で注目したいポイント`;
}

function buildSecuritySpecBody(seed: ArticleSeed) {
  return [
    `${seed.authorLabel}は、AIを活用したセキュリティ監査フレームワーク「${seed.product}」を${seed.action}しました。`,
    `${seed.product}の特徴は、コードから既知のバグパターンを探すだけではなく、まず仕様書を読み取り、「本来守られるべき条件」をチェックリスト化する点です。`,
    "そのうえで、実装コードが仕様どおりに動いているかをAIが検証します。複雑なプロトコルやスマートコントラクトのように、仕様と実装のズレが大きな問題になりやすい分野で、特に相性のよい仕組みです。",
    `この発表で公開された${seed.product}は、「仕様書」を起点にしたAI監査ツールです。`,
    `一般的なコード解析ツールは、コードの中から怪しい書き方や既知の脆弱性パターンを探します。一方で${seed.product}は、まず仕様書に書かれたルールや前提条件を読み取り、それを監査用のチェックリストに変換します。`,
    "その後、実装コードがその条件を満たしているかをAIが確認することで、「仕様ではこう書かれているのに、実装では違う動きをしている」というズレを見つけやすくします。",
    "### なぜ「仕様書から探す」のが重要なのか",
    "セキュリティ上の問題は、単純なコードミスだけで起きるわけではありません。",
    "特にブロックチェーンや分散システムでは、「仕様の解釈ミス」や「実装ごとの挙動の違い」が重大なバグにつながることがあります。",
    `${seed.product}は、そうした仕様レベルの問題をAIで見つけやすくするための仕組みです。`,
    "今回のポイントは、AIが単にコードを読むだけではなく、「仕様書を理解して監査項目を作る」という部分です。",
    "これは、AIエージェントによるセキュリティ監査が、より実務的な段階に進んでいることを示す動きとも言えます。",
    `${seed.product}がどのように仕様書をチェックリスト化し、実装コードを検証するのか。以下で仕組みをもう少し詳しく見ていきます。`,
    "### まとめ",
    `${seed.product}は、AIによるセキュリティ監査の中でも「仕様と実装のズレ」に注目したツールです。`,
    "コードだけを見てバグを探すのではなく、仕様書から守るべき条件を抽出し、それに対して実装が正しく動いているかを確認します。",
    "このアプローチは、複雑なソフトウェアやブロックチェーン関連の監査で特に重要になりそうです。",
  ];
}

function buildGeneralToolBody(seed: ArticleSeed) {
  return [
    `${seed.authorLabel}は、AI活用に関する「${seed.product}」を${seed.action}しました。`,
    `${seed.product}の特徴は、単に機能を増やすだけではなく、${seed.featureLabel}にあります。`,
    "日々の開発や調査、コンテンツ制作では、AIツールをどう組み合わせるかによって作業効率が大きく変わります。今回の発表は、その実務的な使い方を考えるうえで参考になります。",
    `この発表で紹介された${seed.product}は、AIを使った作業の流れを見直すためのツールです。`,
    "特に注目したいのは、何を自動化し、どこを人間が確認するのかという役割分担です。",
    "### どこが実用的なのか",
    "AI関連ツールは数多く出ていますが、実際に使いやすいものは、導入したあとに作業の手順が明確になるものです。",
    `${seed.product}は、そうした実務の流れに入りやすい候補として見ておく価値があります。`,
    "今回のポイントは、AIが単独で何かを完結させるというより、人間の判断を補助しながら作業を進めやすくする点です。",
    "以下で、どんな場面で使えそうか、注意点とあわせて整理します。",
    "### まとめ",
    `${seed.product}は、AI活用をより実務に近づけるためのツールとして注目できます。`,
    "公開された情報だけで判断せず、実際の使い方、料金、導入条件、セキュリティ面を確認しながら試すのがよさそうです。",
  ];
}

function extractProductName(text: string) {
  const quoted = text.match(/[「\"]([A-Za-z0-9_.\-\s]{2,50})[」\"]/)?.[1]?.trim();
  if (quoted) return quoted;

  const known = text.match(/\b(SPECA|Claude Code|Cursor|Codex|Gemini|ChatGPT|GPT-[A-Za-z0-9.-]+|Grok|Perplexity|NotebookLM)\b/)?.[1];
  if (known) return known;

  const afterNamed = text.match(/\b(?:called|named|introducing)\s+([A-Z][A-Za-z0-9_.-]{2,40})\b/i)?.[1];
  if (afterNamed) return afterNamed;

  const uppercase = text.match(/\b[A-Z][A-Z0-9_.-]{2,20}\b/)?.[0];
  return uppercase;
}

function detectAction(text: string) {
  if (/released|release|公開|リリース/i.test(text)) return "公開";
  if (/launched|launch|発表/i.test(text)) return "発表";
  if (/introduced|introducing|紹介/i.test(text)) return "紹介";
  return "登場";
}

function prettifyAuthor(author: string) {
  return author
    .replace(/foundation$/i, " Foundation")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^nyx foundation$/i, "Nyx Foundation");
}

function inferDomainLabel(postText: string) {
  const lower = postText.toLowerCase();

  if (/codex|claude code|cursor|code|開発|コード/i.test(postText)) {
    return "AIコーディング";
  }
  if (lower.includes("image") || postText.includes("画像")) {
    return "画像生成AI";
  }
  if (lower.includes("video") || postText.includes("動画")) {
    return "動画生成AI";
  }
  if (lower.includes("voice") || lower.includes("audio") || postText.includes("音声")) {
    return "音声AI";
  }
  if (lower.includes("research") || postText.includes("調査")) {
    return "AIリサーチ";
  }

  return "AIツール活用";
}

function inferFeatureLabel(postText: string) {
  const lower = postText.toLowerCase();

  if (/codex|claude code|cursor|code|開発|コード/i.test(postText)) {
    return "開発作業の調査、実装、修正を進めやすくする仕組み";
  }
  if (lower.includes("agent") || postText.includes("エージェント")) {
    return "AIに複数ステップの作業を任せやすくする仕組み";
  }
  if (lower.includes("image") || postText.includes("画像")) {
    return "画像制作の流れを短縮し、アイデアを形にしやすくする仕組み";
  }
  if (lower.includes("video") || postText.includes("動画")) {
    return "動画制作や生成ワークフローを効率化する仕組み";
  }

  return "AIを使った作業の流れを改善する仕組み";
}

function translatePostTextForDraft(postText: string, product: string) {
  if (!isLikelyEnglish(postText)) {
    return postText;
  }

  const lower = postText.toLowerCase();
  const points = [];

  if (lower.includes("spec") || lower.includes("specification")) {
    points.push("仕様書を読み取り、守るべき条件を整理します");
  }
  if (lower.includes("audit") || lower.includes("security")) {
    points.push("セキュリティ監査に使うことを想定しています");
  }
  if (lower.includes("bug") || lower.includes("vulnerab")) {
    points.push("バグや脆弱性につながる実装のズレを見つけます");
  }
  if (lower.includes("open source") || lower.includes("oss")) {
    points.push("オープンソースとして公開されています");
  }

  if (points.length === 0) {
    points.push("英語ポストの内容を日本語向けに整理しました");
  }

  return `${product}について、${points.join("。")}。`;
}

function isLikelyEnglish(value: string) {
  const asciiLetters = value.match(/[A-Za-z]/g)?.length ?? 0;
  const japaneseLetters = value.match(/[ぁ-んァ-ヶ一-龠]/g)?.length ?? 0;

  return asciiLetters >= 24 && asciiLetters > japaneseLetters * 2;
}

function cleanupGenericTitle(title: string) {
  return title
    .replace(/、?AI活用の新しい選択肢に/g, "")
    .replace(/、?AI活用の新たな選択肢に/g, "")
    .replace(/、?AI活用の新しい可能性に/g, "")
    .trim();
}

function isGenericDraftTitle(title?: string) {
  if (!title) {
    return false;
  }

  return /AI活用の新しい選択肢に|AI活用の新たな選択肢に|AI活用の新しい可能性に/.test(
    title,
  );
}

function emptyCandidateDraft(): CandidateDraft {
  return {
    body: [],
    imagePrompt: "",
    summary: "",
    title: "",
    translation: "",
  };
}
