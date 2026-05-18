import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { CandidateDecisionButtons } from "@/components/candidate-decision-buttons";
import { CollectWithHermesButton } from "@/components/collect-with-hermes-button";
import { DeleteCandidateButton } from "@/components/delete-candidate-button";
import { XEmbed } from "@/components/x-embed";
import { buildCandidateDraft, readCandidates } from "@/lib/x-candidates";

export const dynamic = "force-dynamic";

export default async function CandidatesPage() {
  const candidates = await readCandidates();

  return (
    <main className="siteShell">
      <header className="articleTop">
        <Link className="backLink" href="/">
          <ArrowLeft size={18} />
          トップへ戻る
        </Link>
        <Link className="brand compactBrand" href="/">
          <span className="brandIcon">AI</span>
          <span>
            <strong>AI Insight JP</strong>
            <small>公開判断キュー</small>
          </span>
        </Link>
      </header>

      <section className="panel candidatesPanel">
        <div className="panelHeader">
          <h1>候補を確認して公開判断</h1>
          <CollectWithHermesButton />
        </div>
        <div className="candidateList">
          {candidates.length === 0 ? (
            <p className="emptyState">まだ候補はありません。</p>
          ) : (
            candidates.map((candidate) => {
              const draft = buildCandidateDraft(candidate);
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
                        current={candidate.decision}
                        id={candidate.id}
                      />
                      <DeleteCandidateButton id={candidate.id} />
                    </div>
                  </div>

                  <aside className="candidateDraftPreview">
                    <div className="draftImagePreview">
                      <Image
                        src="/ai-chip-hero.png"
                        alt=""
                        fill
                        sizes="360px"
                      />
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
                </article>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
