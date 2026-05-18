import { promises as fs } from "node:fs";
import path from "node:path";

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

const knownDrafts: Record<string, CandidateDraft> = {
  "2021397952791707696": {
    title: "Anthropic、Claude Opus 4.6のシステムカードを公開",
    translation:
      "AnthropicはClaude Opus 4.6のシステムカードを公開し、同モデルをASL-3 Standardへ移行したと説明しています。",
    summary:
      "Claude Opus 4.6の安全性評価と運用上の注意点を確認できる一次情報です。",
    body: [
      "Anthropicは公式Xで、Claude Opus 4.6のシステムカード公開を告知しました。",
      "システムカードは、モデルの安全性評価、リスク管理、利用制限を確認するための重要な一次情報です。",
      "企業や開発者は、性能だけでなく導入時の安全性や利用条件を確認する必要があります。",
    ],
    imagePrompt:
      "Dark editorial hero image about AI safety evaluation and model system cards, no text.",
  },
  "2025997928242811253": {
    title: "Anthropic、モデル蒸留攻撃と防御手法の研究を公開",
    translation:
      "Anthropicはモデル蒸留攻撃と、その対策技術に関する研究を公開したと説明しています。",
    summary:
      "商用AIモデルの保護とAPI運用に関わるセキュリティ研究です。",
    body: [
      "Anthropicは公式Xで、モデル蒸留攻撃と防御手法に関する研究を公開したと告知しました。",
      "モデル蒸留攻撃は、対象モデルの出力を利用して似た振る舞いをする別モデルを作るリスクにつながります。",
      "AI事業者にとって、モデル保護とAPI利用制限の設計がより重要になります。",
    ],
    imagePrompt:
      "Dark editorial hero image about AI security research and model extraction defense, no text.",
  },
  "2036836242076188816": {
    title: "Google AI、Lyria 3 ProをAI Pro/Ultra向けに展開",
    translation:
      "Google AIは、Lyria 3 ProがGoogle AI ProとUltraで利用できると案内しています。",
    summary:
      "生成AIの活用領域が音楽制作にも広がっていることを示す更新です。",
    body: [
      "Google AIは公式Xで、Lyria 3 ProがGoogle AI ProとUltraで利用可能になったと案内しました。",
      "Lyriaは音楽生成に関わるGoogleのAI技術です。",
      "クリエイター向けAIの拡大と、商用利用時の権利確認が今後の論点になります。",
    ],
    imagePrompt:
      "Dark editorial hero image about generative music AI and waveform interface, no text.",
  },
  "2011484983391559697": {
    title: "Perplexity、BlueMatrixとの提携を発表",
    translation:
      "PerplexityはBlueMatrixとの提携を公式Xで発表しています。",
    summary:
      "AI検索・調査領域での企業連携として注目されるニュースです。",
    body: [
      "Perplexityは公式Xで、BlueMatrixとの提携を発表しました。",
      "AI検索や調査支援の領域では、企業向けデータやワークフロー連携が重要になっています。",
      "今回の提携がどの機能や利用者層に影響するか、公式情報をもとに確認する必要があります。",
    ],
    imagePrompt:
      "Dark editorial hero image about AI search partnerships and enterprise intelligence, no text.",
  },
};

export async function readCandidates() {
  try {
    const raw = (await fs.readFile(storePath, "utf8")).replace(/^\uFEFF/, "");
    return JSON.parse(raw) as XPostCandidate[];
  } catch {
    return [];
  }
}

export async function writeCandidates(candidates: XPostCandidate[]) {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(candidates, null, 2), "utf8");
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
      reason: "Official account post. Ready for article review.",
      sourceType: "official" as const,
    };
  }

  if (developerAccounts.has(author)) {
    return {
      articleWorthy: true,
      reason: "Developer or semi-official account post. Ready for article review.",
      sourceType: "developer" as const,
    };
  }

  return {
    articleWorthy: false,
    reason: "Unknown account. Needs manual review before article creation.",
    sourceType: "unknown" as const,
  };
}

export function buildCandidateDraft(candidate: XPostCandidate): CandidateDraft {
  return (
    knownDrafts[candidate.statusId] ?? {
      title: `${candidate.author}の公式ポストを確認`,
      translation:
        "このポストはまだ本文取得と翻訳が完了していません。X埋め込みを確認してから公開判断してください。",
      summary:
        "公式のXポストURLは登録済みです。公開前に内容確認と本文編集が必要です。",
      body: [
        "この候補はXポストURLから登録されました。",
        "本文取得と事実確認がまだ完了していないため、公開前に公式情報の内容を確認してください。",
      ],
      imagePrompt:
        "Dark editorial hero image for AI industry news, no text, no logos.",
    }
  );
}

export async function registerCandidate(inputUrl: string) {
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
  const next = candidates.map((candidate) =>
    candidate.id === id
      ? { ...candidate, decision, decidedAt: new Date().toISOString() }
      : candidate,
  );
  await writeCandidates(next);
  return { candidates: next };
}

export async function deleteCandidate(id: string) {
  const candidates = await readCandidates();
  const next = candidates.filter((candidate) => candidate.id !== id);
  await writeCandidates(next);

  return {
    deleted: next.length !== candidates.length,
    candidates: next,
  };
}
