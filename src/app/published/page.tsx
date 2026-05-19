import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { CandidateDecisionButtons } from "@/components/candidate-decision-buttons";
import { DeleteCandidateButton } from "@/components/delete-candidate-button";
import { SiteHeader } from "@/components/site-header";
import {
  buildCandidateDraft,
  getCandidateImage,
  getHeadlineCandidates,
  getPublicCandidates,
  readCandidates,
} from "@/lib/x-candidates";

export const dynamic = "force-dynamic";

export default async function PublishedPage() {
  const candidates = await readCandidates();
  const publicCandidates = getPublicCandidates(candidates);
  const headlineCandidate = getHeadlineCandidates(candidates)[0];
  const backdropCandidate = headlineCandidate ?? publicCandidates[0];
  const backdropImage = backdropCandidate
    ? getCandidateImage(backdropCandidate)
    : "/ai-chip-hero.png";

  return (
    <main
      className="siteShell fixedBackdropShell homeShell articleIndexShell"
      style={{ "--page-bg": `url(${backdropImage})` } as CSSProperties}
    >
      <SiteHeader />

      <section className="publishedAdminHead">
        <h1>公開済み記事の管理</h1>
        <p>メインページと同じ見た目で確認しながら、非公開化・削除できます。</p>
      </section>

      {publicCandidates.length === 0 ? (
        <section className="panel emptyPublicPanel">
          <p className="emptyState">公開中の記事はありません。</p>
        </section>
      ) : (
        <section className="homeArticleGrid publishedAdminGrid">
          {publicCandidates.map((candidate) => {
            const draft = buildCandidateDraft(candidate);
            const image = getCandidateImage(candidate);
            const allowHeadline =
              candidate.sourceType === "official" ||
              candidate.sourceType === "developer";

            return (
              <article className="homeArticleCard publishedAdminCard" key={candidate.id}>
                <Link href={`/articles/${candidate.id}`}>
                  <div className="homeArticleImage">
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="(max-width: 720px) 100vw, (max-width: 1180px) 45vw, 260px"
                    />
                    <span>
                      {candidate.decision === "headline" ? "見出し" : "公開"}
                    </span>
                  </div>
                  <h2>{draft.title}</h2>
                  <p>
                    <span>◎</span>
                    {formatCandidateDate(candidate.decidedAt ?? candidate.createdAt)}
                  </p>
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
        </section>
      )}
    </main>
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
