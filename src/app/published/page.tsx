import Link from "next/link";
import { CandidateDecisionButtons } from "@/components/candidate-decision-buttons";
import { DeletedItemActions } from "@/components/deleted-item-actions";
import { DeleteCandidateButton } from "@/components/delete-candidate-button";
import { HiddenStaticArticleActions } from "@/components/hidden-static-article-actions";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { StaticArticleAdminButtons } from "@/components/static-article-admin-buttons";
import {
  getDeletedStaticArticles,
  getHiddenStaticArticles,
  getVisibleStaticArticles,
} from "@/lib/article-visibility";
import { latestArticles } from "@/lib/mock-data";
import {
  buildCandidateDraft,
  getDeletedCandidates,
  getHeadlineCandidates,
  getPublicCandidates,
  readCandidates,
  type XPostCandidate,
} from "@/lib/x-candidates";

export const dynamic = "force-dynamic";

type AdminArticleCard = {
  candidate?: XPostCandidate;
  date: string;
  href: string;
  id: string;
  label: string;
  title: string;
};

export default async function PublishedPage() {
  const candidates = await readCandidates();
  const visibleStaticArticles = await getVisibleStaticArticles();
  const hiddenCandidateArticles = candidates.filter(
    (candidate) =>
      !candidate.deletedAt &&
      candidate.decidedAt &&
      candidate.decision !== "published" &&
      candidate.decision !== "headline",
  );
  const hiddenStaticArticles = await getHiddenStaticArticles();
  const deletedCandidateArticles = getDeletedCandidates(candidates).filter(
    (candidate) =>
      candidate.decision === "published" || candidate.decision === "headline",
  );
  const deletedStaticArticles = await getDeletedStaticArticles();
  const headlineCandidate = getHeadlineCandidates(candidates)[0];
  const headlineDraft = headlineCandidate
    ? buildCandidateDraft(headlineCandidate)
    : null;
  const publicCandidates = getPublicCandidates(candidates);
  const lead = visibleStaticArticles[0] ?? latestArticles[0];

  const hero =
    headlineCandidate && headlineDraft
      ? {
          candidate: headlineCandidate,
          category: "見出し記事",
          date: "候補管理から選択",
          excerpt: headlineDraft.summary,
          href: `/published/articles/${headlineCandidate.id}`,
          source: headlineCandidate.author,
          title: headlineDraft.title,
        }
      : {
          category: "見出し記事",
          date: lead.date,
          excerpt: lead.excerpt,
          href: `/published/articles/${lead.id}`,
          source: lead.source,
          title: lead.title,
        };

  const publicCards: AdminArticleCard[] = publicCandidates
    .filter((candidate) => candidate.id !== headlineCandidate?.id)
    .map((candidate) => {
      const draft = buildCandidateDraft(candidate);
      return {
        candidate,
        date: formatCandidateDate(candidate.decidedAt ?? candidate.createdAt),
        href: `/published/articles/${candidate.id}`,
        id: candidate.id,
        label: candidate.decision === "headline" ? "見出し" : "公開",
        title: draft.title,
      };
    });

  const staticCards: AdminArticleCard[] = visibleStaticArticles.map((article, index) => ({
    date: article.date,
    href: `/published/articles/${article.id}`,
    id: article.id,
    label: index === 0 ? "固定記事" : article.category,
    title: article.title,
  }));

  const articleCards = [...publicCards, ...staticCards];

  return (
    <main className="simpleSiteShell adminShell">
      <SiteHeader admin />

      <section className="simpleHero adminHero">
        <div className="simpleHeroText">
          <span>{hero.category}</span>
          <h1>{hero.title}</h1>
          <p>{hero.excerpt}</p>
          <p className="sourceLine">
            {hero.source} / {hero.date}
          </p>
          <Link className="heroCta" href={hero.href}>
            記事を編集
          </Link>
          {hero.candidate && (
            <div className="candidatePublicActions">
              <CandidateDecisionButtons
                allowHeadline={
                  hero.candidate.sourceType === "official" ||
                  hero.candidate.sourceType === "developer"
                }
                current={hero.candidate.decision}
                id={hero.candidate.id}
                mode="public"
              />
              <DeleteCandidateButton id={hero.candidate.id} />
            </div>
          )}
        </div>
      </section>

      <section className="simpleArticleSection">
        <div className="simpleSectionHead">
          <h2>公開中の記事</h2>
          <p>公開サイトに表示される記事です。非公開、削除、見出し切り替えをここで管理します。</p>
        </div>
        <div className="simpleArticleGrid">
          {articleCards.map((article) => (
            <article
              className="simpleArticleCard publishedAdminCard"
              key={`${article.id}-${article.label}`}
            >
              <Link href={article.href}>
                <span>{article.label}</span>
                <h3>{article.title}</h3>
                <small>{article.date}</small>
              </Link>

              {article.candidate ? (
                <div className="candidatePublicActions">
                  <CandidateDecisionButtons
                    allowHeadline={
                      article.candidate.sourceType === "official" ||
                      article.candidate.sourceType === "developer"
                    }
                    current={article.candidate.decision}
                    id={article.candidate.id}
                    mode="public"
                  />
                  <DeleteCandidateButton id={article.candidate.id} />
                </div>
              ) : (
                <StaticArticleAdminButtons id={article.id} />
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="panel deletedItemsPanel">
        <div className="panelHeader">
          <div>
            <p className="adminKicker">非公開</p>
            <h1>非公開にした記事</h1>
          </div>
        </div>
        <div className="deletedItemList">
          {hiddenCandidateArticles.length === 0 &&
          hiddenStaticArticles.length === 0 ? (
            <p className="emptyState">非公開にした記事はありません。</p>
          ) : (
            <>
              {hiddenCandidateArticles.map((candidate) => {
                const draft = buildCandidateDraft(candidate);
                return (
                  <article className="deletedItemCard" key={candidate.id}>
                    <Link href={`/published/articles/${candidate.id}`}>
                      <strong>{draft.title}</strong>
                    </Link>
                    <p>
                      {candidate.author} / {candidate.decidedAt}
                    </p>
                    <div className="candidatePublicActions">
                      <CandidateDecisionButtons
                        allowHeadline={
                          candidate.sourceType === "official" ||
                          candidate.sourceType === "developer"
                        }
                        current={candidate.decision}
                        id={candidate.id}
                        mode="review"
                      />
                      <DeleteCandidateButton id={candidate.id} />
                    </div>
                  </article>
                );
              })}
              {hiddenStaticArticles.map((article) => (
                <article className="deletedItemCard" key={article.id}>
                  <Link href={`/published/articles/${article.id}`}>
                    <strong>{article.title}</strong>
                  </Link>
                  <p>
                    {article.source} / {article.date}
                  </p>
                  <HiddenStaticArticleActions id={article.id} />
                </article>
              ))}
            </>
          )}
        </div>
      </section>

      <section className="panel deletedItemsPanel">
        <div className="panelHeader">
          <div>
            <p className="adminKicker">削除済み</p>
            <h1>削除した公開記事</h1>
          </div>
        </div>
        <div className="deletedItemList">
          {deletedCandidateArticles.length === 0 &&
          deletedStaticArticles.length === 0 ? (
            <p className="emptyState">削除した公開記事はありません。</p>
          ) : (
            <>
              {deletedCandidateArticles.map((candidate) => {
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
              })}
              {deletedStaticArticles.map((article) => (
                <article className="deletedItemCard" key={article.id}>
                  <strong>{article.title}</strong>
                  <p>
                    {article.source} / {article.date}
                  </p>
                  <DeletedItemActions id={article.id} type="static" />
                </article>
              ))}
            </>
          )}
        </div>
      </section>
      <SiteFooter admin />
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
