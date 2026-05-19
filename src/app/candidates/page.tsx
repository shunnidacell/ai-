import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { CandidateDecisionButtons } from "@/components/candidate-decision-buttons";
import { CollectWithHermesButton } from "@/components/collect-with-hermes-button";
import { DeleteCandidateButton } from "@/components/delete-candidate-button";
import { SiteHeader } from "@/components/site-header";
import { XEmbed } from "@/components/x-embed";
import {
  buildCandidateDraft,
  getCandidateImage,
  getPublicCandidates,
  readCandidates,
  sortCandidatesByNewest,
  type XPostCandidate,
} from "@/lib/x-candidates";

export const dynamic = "force-dynamic";

export default async function CandidatesPage() {
  const candidates = await readCandidates();
  const publicCandidates = getPublicCandidates(candidates);
  const reviewCandidates = sortCandidatesByNewest(
    candidates.filter(
      (candidate) =>
        candidate.decision !== "published" && candidate.decision !== "headline",
    ),
  );
  const backdropCandidate = publicCandidates[0] ?? reviewCandidates[0];
  const backdropImage = backdropCandidate
    ? getCandidateImage(backdropCandidate)
    : "/ai-chip-hero.png";

  return (
    <main
      className="siteShell fixedBackdropShell"
      style={{ "--page-bg": `url(${backdropImage})` } as CSSProperties}
    >
      <SiteHeader />

      <section className="panel candidatesPanel">
        <div className="panelHeader">
          <h1>候補を確認して公開判断</h1>
          <CollectWithHermesButton />
        </div>
        <div className="candidateList">
          {reviewCandidates.length === 0 ? (
            <p className="emptyState">未確認の候補はありません。</p>
          ) : (
            reviewCandidates.map((candidate) => {
              return (
                <article className="candidateReviewItem" key={candidate.id}>
                  <div className="candidateReviewMain">
                    <div className="candidateStatusLine">
                      <strong>{candidate.author}</strong>
                      <span>{candidate.decision ?? "draft"}</span>
                      <a href={candidate.url} target="_blank" rel="noreferrer">
                        Xで開く
                        <ArrowUpRight size={15} />
                      </a>
                    </div>

                    <XEmbed url={candidate.url} />

                    <div className="candidateActions">
                      <CandidateDecisionButtons
                        allowHeadline={
                          candidate.sourceType === "official" ||
                          candidate.sourceType === "developer"
                        }
                        current={candidate.decision}
                        id={candidate.id}
                      />
                      <DeleteCandidateButton id={candidate.id} />
                    </div>
                  </div>

                  <CandidateDraftPreview candidate={candidate} />
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="panel candidatesPanel publicArticlesPanel">
        <div className="panelHeader">
          <h1>公開中の記事管理</h1>
          <p>公開済みの記事を確認し、非公開化または削除できます。</p>
        </div>

        {publicCandidates.length === 0 ? (
          <p className="emptyState">公開中の記事はまだありません。</p>
        ) : (
          <div className="candidatePublicGrid">
            {publicCandidates.map((candidate) => {
              const draft = buildCandidateDraft(candidate);
              const allowHeadline =
                candidate.sourceType === "official" ||
                candidate.sourceType === "developer";

              return (
                <article className="candidatePublicCard" key={candidate.id}>
                  <Link href={`/articles/${candidate.id}`}>
                    <div className="homeArticleImage">
                      <Image
                        src={getCandidateImage(candidate)}
                        alt=""
                        fill
                        sizes="(max-width: 720px) 100vw, 280px"
                      />
                      <span>
                        {candidate.decision === "headline" ? "見出し" : "公開"}
                      </span>
                    </div>
                    <h2>{draft.title}</h2>
                    <p>{formatCandidateDate(candidate.decidedAt ?? candidate.createdAt)}</p>
                  </Link>

                  <div className="candidatePublicActions">
                    <CandidateDecisionButtons
                      allowHeadline={allowHeadline}
                      current={candidate.decision}
                      id={candidate.id}
                      mode="public"
                    />
                    <DeleteCandidateButton id={candidate.id} />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function CandidateDraftPreview({
  candidate,
}: {
  candidate: XPostCandidate;
}) {
  const draft = buildCandidateDraft(candidate);

  return (
    <aside className="candidateDraftPreview">
      <div className="draftImagePreview">
        <Image src={getCandidateImage(candidate)} alt="" fill sizes="360px" />
      </div>
      <p className="draftLabel">翻訳</p>
      <p>{draft.translation}</p>
      <p className="draftLabel">記事タイトル</p>
      <h2>{draft.title}</h2>
      <p className="draftLabel">本文案</p>
      {draft.body.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <p className="draftLabel">画像生成プロンプト</p>
      <code>{draft.imagePrompt}</code>
    </aside>
  );
}

function formatCandidateDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}
