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
        candidate.decision !== "published" &&
        candidate.decision !== "headline",
    ),
  );

  return (
    <main className="simpleSiteShell adminShell">
      <SiteHeader admin />

      <section className="panel candidatesPanel">
        <div className="panelHeader">
          <div>
            <p className="adminKicker">記事候補</p>
            <h1>新しい記事を編集して公開判断</h1>
          </div>
          <CollectWithHermesButton />
        </div>
        <div className="candidateList">
          {reviewCandidates.length === 0 ? (
            <p className="emptyState">確認待ちの記事候補はありません。</p>
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
          <div>
            <p className="adminKicker">削除済み</p>
            <h1>削除した下書き</h1>
          </div>
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
                  <p>
                    {candidate.author} / {candidate.deletedAt}
                  </p>
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
      <CandidateEditForm
        draft={draft}
        id={candidate.id}
        image={image}
        postImageUrl={candidate.postImageUrl}
        postText={candidate.postText}
      />
    </aside>
  );
}
