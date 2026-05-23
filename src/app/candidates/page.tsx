import { ArrowUpRight } from "lucide-react";
import { BookmarkIntakeForm } from "@/components/bookmark-intake-form";
import { CandidateDecisionButtons } from "@/components/candidate-decision-buttons";
import { CandidateEditForm } from "@/components/candidate-edit-form";
import { CollectWithHermesButton } from "@/components/collect-with-hermes-button";
import { DeleteCandidateButton } from "@/components/delete-candidate-button";
import { DeletedItemActions } from "@/components/deleted-item-actions";
import { SiteHeader } from "@/components/site-header";
import {
  buildCandidateDraft,
  getCandidateImage,
  getDeletedCandidates,
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
    <main className="simpleSiteShell adminShell candidateDenseShell">
      <SiteHeader admin />

      <section className="panel bookmarkIntakePanel compactPanel">
        <div className="panelHeader">
          <div>
            <p className="adminKicker">Xブックマーク</p>
            <h1>ブックマークしたポストから選ぶ</h1>
            <p>
              Xでブックマークした中から記事化したいポストだけを選び、URLを貼って候補に追加します。
            </p>
            <p>
              自動同期はPCで <code>npm run sync:bookmarks:chrome</code> を実行します。
            </p>
          </div>
        </div>
        <BookmarkIntakeForm />
      </section>

      <section className="panel candidatesPanel compactPanel">
        <div className="panelHeader">
          <div>
            <p className="adminKicker">記事候補</p>
            <h1>確認待ちの記事候補</h1>
            <p>{reviewCandidates.length}件の候補があります。</p>
          </div>
          <CollectWithHermesButton />
        </div>
        <div className="candidateCompactList">
          {reviewCandidates.length === 0 ? (
            <p className="emptyState">確認待ちの記事候補はありません。</p>
          ) : (
            reviewCandidates.map((candidate) => (
              <CandidateCompactCard candidate={candidate} key={candidate.id} />
            ))
          )}
        </div>
      </section>

      <section className="panel candidatesPanel deletedItemsPanel compactPanel">
        <div className="panelHeader">
          <div>
            <p className="adminKicker">削除済み</p>
            <h1>削除した下書き</h1>
          </div>
        </div>
        <div className="deletedItemList compactDeletedList">
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

function CandidateCompactCard({
  candidate,
}: {
  candidate: XPostCandidate;
}) {
  const draft = buildCandidateDraft(candidate);
  const image = getCandidateImage(candidate);

  return (
    <article className="candidateCompactCard">
      <div className="candidateCompactMain">
        <div className="candidateCompactMeta">
          <strong>{candidate.author}</strong>
          <span>{candidate.decision ?? "draft"}</span>
          <a href={candidate.url} target="_blank" rel="noreferrer">
            Xで開く
            <ArrowUpRight size={14} />
          </a>
        </div>
        <h2>{draft.title}</h2>
        <p>{draft.summary}</p>
      </div>

      <div className="candidateCompactActions">
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

      <details className="candidateEditDetails">
        <summary>編集を開く</summary>
        <CandidateEditForm
          draft={draft}
          id={candidate.id}
          image={image}
          postImageUrl={candidate.postImageUrl}
          postText={candidate.postText}
        />
      </details>
    </article>
  );
}
