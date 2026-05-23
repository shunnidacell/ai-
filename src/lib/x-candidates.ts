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
  const postText = candidate.postText?.trim();
  const fallbackTitle = `${candidate.author}のXポストから記事候補を作成`;
  const fallbackSummary =
    "登録されたXポストをもとにした記事候補です。公開前に本文、事実関係、画像を確認してください。";
  const fallbackBody = [
    postText
      ? `登録されたポストでは、${postText}`
      : "この候補は、管理画面で登録されたXポストURLから作成されています。",
    "公開する前に、ポスト本文、関連情報、日付、画像が正しいかを確認してください。",
    "必要に応じてタイトルや本文を編集し、読者にとって分かりやすい記事に整えてから公開します。",
  ];

  return {
    body: candidate.draftBody?.length ? candidate.draftBody : fallbackBody,
    imagePrompt:
      candidate.draftImagePrompt ??
      "Clean editorial AI news image based on the article title, bright technology style, no text.",
    summary: candidate.draftSummary ?? fallbackSummary,
    title: candidate.draftTitle ?? fallbackTitle,
    translation:
      candidate.draftTranslation ??
      postText ??
      "ポスト本文はまだ登録されていません。管理画面で本文を補完してください。",
  };
}

export function getCandidateImage(candidate: XPostCandidate) {
  return (
    candidate.imageOverride ??
    candidate.postImageUrl ??
    `/api/x-candidates/${encodeURIComponent(candidate.id)}/image.svg`
  );
}

export async function registerCandidate(
  inputUrl: string,
  meta?: { postImageUrl?: string; postText?: string },
) {
  const parsed = parseXPostUrl(inputUrl);
  const classification = classifyCandidate(parsed.author);
  const candidates = await readCandidates();
  const existing = candidates.find(
    (candidate) => candidate.statusId === parsed.statusId,
  );

  if (existing) {
    return { candidate: existing, created: false };
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

  return { candidate, created: true };
}

export async function updateCandidateDecision(
  id: string,
  decision: CandidateDecision,
) {
  const candidates = await readCandidates();
  const decidedAt = new Date().toISOString();
  let next = candidates.map((candidate) =>
    candidate.id === id
      ? { ...candidate, decision, decidedAt }
      : candidate,
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
          : draft.title.trim() || undefined,
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
