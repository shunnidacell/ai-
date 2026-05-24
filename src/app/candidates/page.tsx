import { ArrowUpRight } from "lucide-react";
import { BookmarkIntakeForm } from "@/components/bookmark-intake-form";
import { CandidateDecisionButtons } from "@/components/candidate-decision-buttons";
import { CandidateEditForm } from "@/components/candidate-edit-form";
import { CollectWithHermesButton } from "@/components/collect-with-hermes-button";
import { DeleteCandidateButton } from "@/components/delete-candidate-button";
import { DeletedItemActions } from "@/components/deleted-item-actions";
import { SiteHeader } from "@/components/site-header";
import { XEmbed } from "@/components/x-embed";
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
            <p className="adminKicker">X&#12502;&#12483;&#12463;&#12510;&#12540;&#12463;</p>
            <h1>&#12502;&#12483;&#12463;&#12510;&#12540;&#12463;&#12375;&#12383;&#12509;&#12473;&#12488;&#12363;&#12425;&#36984;&#12406;</h1>
            <p>
              X&#12391;&#12502;&#12483;&#12463;&#12510;&#12540;&#12463;&#12375;&#12383;&#20013;&#12363;&#12425;&#35352;&#20107;&#21270;&#12375;&#12383;&#12356;&#12509;&#12473;&#12488;&#12384;&#12369;&#12434;&#36984;&#12403;&#12289;URL&#12434;&#36028;&#12387;&#12390;&#20505;&#35036;&#12395;&#36861;&#21152;&#12375;&#12414;&#12377;&#12290;
            </p>
            <p>
              &#33258;&#21205;&#21516;&#26399;&#12399;PC&#12391; <code>npm run sync:bookmarks:chrome</code> &#12434;&#23455;&#34892;&#12375;&#12414;&#12377;&#12290;
            </p>
          </div>
        </div>
        <BookmarkIntakeForm />
      </section>

      <section className="panel candidatesPanel compactPanel">
        <div className="panelHeader">
          <div>
            <p className="adminKicker">&#35352;&#20107;&#20505;&#35036;</p>
            <h1>&#30906;&#35469;&#24453;&#12385;&#12398;&#35352;&#20107;&#20505;&#35036;</h1>
            <p>{reviewCandidates.length}&#20214;&#12398;&#20505;&#35036;&#12364;&#12354;&#12426;&#12414;&#12377;&#12290;</p>
          </div>
          <CollectWithHermesButton />
        </div>
        <div className="candidateCompactList">
          {reviewCandidates.length === 0 ? (
            <p className="emptyState">&#30906;&#35469;&#24453;&#12385;&#12398;&#35352;&#20107;&#20505;&#35036;&#12399;&#12354;&#12426;&#12414;&#12379;&#12435;&#12290;</p>
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
            <p className="adminKicker">&#21066;&#38500;&#28168;&#12415;</p>
            <h1>&#21066;&#38500;&#12375;&#12383;&#19979;&#26360;&#12365;</h1>
          </div>
        </div>
        <div className="deletedItemList compactDeletedList">
          {deletedCandidates.length === 0 ? (
            <p className="emptyState">&#21066;&#38500;&#12375;&#12383;&#19979;&#26360;&#12365;&#12399;&#12354;&#12426;&#12414;&#12379;&#12435;&#12290;</p>
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
            X&#12391;&#38283;&#12367;
            <ArrowUpRight size={14} />
          </a>
        </div>
        <h2>{draft.title}</h2>
        <p>{draft.summary}</p>
      </div>

      <div className="candidateEmbedBox">
        <XEmbed url={candidate.url} />
      </div>

      <div className="candidateCompactActions">
        <CandidateDecisionButtons
          allowHeadline
          current={candidate.decision}
          id={candidate.id}
        />
        <DeleteCandidateButton id={candidate.id} />
      </div>

      <details className="candidateEditDetails" open>
        <summary>&#32232;&#38598;&#12434;&#38283;&#12367;</summary>
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
