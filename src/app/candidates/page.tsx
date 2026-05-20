import Image from "next/image";
import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { CandidateDecisionButtons } from "@/components/candidate-decision-buttons";
import { CandidateEditForm } from "@/components/candidate-edit-form";
import { CollectWithHermesButton } from "@/components/collect-with-hermes-button";
import { DeleteCandidateButton } from "@/components/delete-candidate-button";
import { DeletedItemActions } from "@/components/deleted-item-actions";
import { SiteHeader } from "@/components/site-header";
import { XEmbed } from "@/components/x-embed";
import {
  buildCandidateDraft,
  getDeletedCandidates,
  getCandidateImage,
  readCandidates,
  sortCandidatesByNewest,
  type XPostCandidate,
} from "@/lib/x-candidates";

export const dynamic = "force-dynamic";

export default async function CandidatesPage() {
  const candidates = await readCandidates();
  const deletedCandidates = getDeletedCandidates(candidates).filter(
    (candidate) =>
      candidate.decision !== "published" && candidate.decision !== "headline",
  );
  const reviewCandidates = sortCandidatesByNewest(
    candidates.filter(
      (candidate) =>
        !candidate.deletedAt &&
        candidate.decision !== "published" && candidate.decision !== "headline",
    ),
  );
  const backdropCandidate = reviewCandidates[0];
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
          <h1>新しい記事を編集して公開判断</h1>
          <CollectWithHermesButton />
        </div>
        <div className="candidateList">
          {reviewCandidates.length === 0 ? (
            <p className="emptyState">未確認の候補はありません。</p>
          ) : (
            reviewCandidates.map((candidate) => (
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
            ))
          )}
        </div>
      </section>

      <section className="panel candidatesPanel deletedItemsPanel">
        <div className="panelHeader">
          <h1>削除した下書き</h1>
        </div>
        <div className="deletedItemList">
          {deletedCandidates.length === 0 ? (
            <p className="emptyState">削除した下書きはありません。</p>
          ) : (
            deletedCandidates.map((candidate) => {
              const draft = buildCandidateDraft(candidate);
              return (
                <article className="deletedItemCard" key={candidate.id}>
                  <strong>{draft.title}</strong>
                  <p>{candidate.author} ・ {candidate.deletedAt}</p>
                  <DeletedItemActions id={candidate.id} type="candidate" />
                </article>
              );
            })
          )}
        </div>
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
  const image = getCandidateImage(candidate);

  return (
    <aside className="candidateDraftPreview">
      <div className="draftImagePreview">
        <Image src={image} alt="" fill sizes="360px" />
      </div>
      <CandidateEditForm draft={draft} id={candidate.id} image={image} />
    </aside>
  );
}
