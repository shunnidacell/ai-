import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { latestArticles } from "@/lib/mock-data";
import {
  buildCandidateDraft,
  getCandidateImage,
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
  const headlineCandidate = candidates.find(
    (candidate) => candidate.decision === "headline",
  );
  const headlineDraft = headlineCandidate
    ? buildCandidateDraft(headlineCandidate)
    : null;

  const headlineArticle: HomeArticle | null =
    headlineCandidate && headlineDraft
      ? {
          id: headlineCandidate.id,
          title: headlineDraft.title,
          date: "候補管理から選択",
          image: getCandidateImage(headlineCandidate),
          source: headlineCandidate.author,
          label: "注目",
        }
      : null;

  const articleCards: HomeArticle[] = [
    ...(headlineArticle ? [headlineArticle] : []),
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
    <main className="siteShell homeShell articleIndexShell">
      <SiteHeader />

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
