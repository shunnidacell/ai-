import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { SiteHeader } from "@/components/site-header";
import { latestArticles } from "@/lib/mock-data";
import {
  buildCandidateDraft,
  getHeadlineCandidates,
  getCandidateImage,
  getPublicCandidates,
  readCandidates,
} from "@/lib/x-candidates";

export const dynamic = "force-dynamic";

type HomeArticle = {
  id: string;
  title: string;
  date: string;
  image: string;
  source: string;
  label: string;
};

export default async function Home() {
  const candidates = await readCandidates();
  const headlineCandidates = getHeadlineCandidates(candidates);
  const headlineCandidate = headlineCandidates[0];
  const headlineDraft = headlineCandidate
    ? buildCandidateDraft(headlineCandidate)
    : null;
  const lead = latestArticles[0];

  const hero =
    headlineCandidate && headlineDraft
      ? {
          category: "注目記事",
          date: "候補管理から選択",
          excerpt: headlineDraft.summary,
          href: `/articles/${headlineCandidate.id}`,
          image: getCandidateImage(headlineCandidate),
          source: headlineCandidate.author,
          title: headlineDraft.title,
        }
      : {
          category: "注目記事",
          date: lead.date,
          excerpt: lead.excerpt,
          href: `/articles/${lead.id}`,
          image: lead.image,
          source: lead.source,
          title: lead.title,
        };

  const publishedCandidateCards: HomeArticle[] = getPublicCandidates(candidates)
    .filter((candidate) => candidate.id !== headlineCandidate?.id)
    .map((candidate) => {
      const draft = buildCandidateDraft(candidate);
      return {
        id: candidate.id,
        title: draft.title,
        date: formatCandidateDate(candidate.decidedAt ?? candidate.createdAt),
        image: getCandidateImage(candidate),
        source: candidate.author,
        label: candidate.decision === "headline" ? "見出し" : "公開",
      };
    });

  const articleCards: HomeArticle[] = [
    ...publishedCandidateCards,
    ...latestArticles.map((article, index) => ({
      id: article.id,
      title: article.title,
      date: article.date,
      image: article.image,
      source: article.source,
      label: index === 0 ? "最新" : article.category,
    })),
  ];

  return (
    <main
      className="siteShell fixedBackdropShell homeShell articleIndexShell"
      style={{ "--page-bg": `url(${hero.image})` } as CSSProperties}
    >
      <SiteHeader />

      <Link className="heroCard hasHeroImage" href={hero.href}>
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
          <span className="heroCta">続きを読む</span>
        </div>
        <div className="sliderDots" aria-hidden="true">
          <span className="current" />
          <span />
          <span />
          <span />
        </div>
      </Link>

      <div className="homeContentLayout">
        <section className="homeArticleGrid" aria-label="記事一覧">
          {articleCards.map((article) => (
            <Link
              className="homeArticleCard"
              href={`/articles/${article.id}`}
              key={`${article.id}-${article.label}`}
            >
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
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}
