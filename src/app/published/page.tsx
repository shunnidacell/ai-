import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { CandidateDecisionButtons } from "@/components/candidate-decision-buttons";
import { DeleteCandidateButton } from "@/components/delete-candidate-button";
import { SiteHeader } from "@/components/site-header";
import { StaticArticleAdminButtons } from "@/components/static-article-admin-buttons";
import { getVisibleStaticArticles } from "@/lib/article-visibility";
import { latestArticles } from "@/lib/mock-data";
import {
  buildCandidateDraft,
  getCandidateImage,
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
  image: string;
  label: string;
  title: string;
};

export default async function PublishedPage() {
  const candidates = await readCandidates();
  const visibleStaticArticles = await getVisibleStaticArticles();
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
          category: "注目記事",
          date: "候補管理から選択",
          excerpt: headlineDraft.summary,
          href: `/published/articles/${headlineCandidate.id}`,
          image: getCandidateImage(headlineCandidate),
          source: headlineCandidate.author,
          title: headlineDraft.title,
        }
      : {
          category: "注目記事",
          date: lead.date,
          excerpt: lead.excerpt,
          href: `/published/articles/${lead.id}`,
          image: lead.image,
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
        image: getCandidateImage(candidate),
        label: candidate.decision === "headline" ? "見出し" : "公開",
        title: draft.title,
      };
    });

  const staticCards: AdminArticleCard[] = visibleStaticArticles.map((article, index) => ({
    date: article.date,
    href: `/published/articles/${article.id}`,
    id: article.id,
    image: article.image,
    label: index === 0 ? "固定記事" : article.category,
    title: article.title,
  }));

  const articleCards = [...publicCards, ...staticCards];

  return (
    <main
      className="siteShell fixedBackdropShell homeShell articleIndexShell"
      style={{ "--page-bg": `url(${hero.image})` } as CSSProperties}
    >
      <SiteHeader admin />

      <section className="heroCard hasHeroImage">
        <div
          aria-hidden="true"
          className="heroFixedBg"
          style={{ backgroundImage: `url(${hero.image})` }}
        />
        <div className="heroOverlay" />
        <div className="heroContent">
          <span className="badge">{hero.category}</span>
          <h1>{hero.title}</h1>
          <p>{hero.excerpt}</p>
          <p className="sourceLine">
            <span className="sourceAvatar">{hero.source.slice(0, 1)}</span>
            {hero.source} ・ {hero.date} ・ AIニュース
          </p>
          <Link className="heroCta" href={hero.href}>
            記事を見る
          </Link>
        </div>
        {hero.candidate && (
          <div className="heroAdminActions">
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
        <div className="sliderDots" aria-hidden="true">
          <span className="current" />
          <span />
          <span />
          <span />
        </div>
      </section>

      <div className="homeContentLayout">
        <section className="homeArticleGrid" aria-label="公開記事一覧">
          {articleCards.map((article) => (
            <article
              className="homeArticleCard publishedAdminCard"
              key={`${article.id}-${article.label}`}
            >
              <Link href={article.href}>
                <div className="homeArticleImage">
                  <Image
                    src={article.image}
                    alt=""
                    fill
                    sizes="(max-width: 720px) 100vw, (max-width: 1180px) 45vw, 260px"
                  />
                  <span>{article.label}</span>
                </div>
                <h2>{article.title}</h2>
                <p>
                  <span>◎</span>
                  {article.date}
                </p>
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
        </section>

        <aside className="sponsorRail" aria-label="スポンサー枠">
          <h2>スポンサー様</h2>
          <div className="sponsorDivider" />
          <div className="sponsorBanner">
            <span>広告募集中</span>
            <small>この枠でサービスをPRできます</small>
          </div>
        </aside>
      </div>
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
