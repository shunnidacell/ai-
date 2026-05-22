import type { CSSProperties } from "react";
import {
  HomeArticleExplorer,
  type HomeExplorerArticle,
} from "@/components/home-article-explorer";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { getVisibleStaticArticles } from "@/lib/article-visibility";
import {
  buildCandidateDraft,
  getCandidateImage,
  getHeadlineCandidates,
  getPublicCandidates,
  readCandidates,
} from "@/lib/x-candidates";

export const dynamic = "force-dynamic";

export default async function Home() {
  const visibleStaticArticles = await getVisibleStaticArticles();
  const candidates = await readCandidates();
  const headlineCandidates = getHeadlineCandidates(candidates);
  const headlineCandidate = headlineCandidates[0];
  const headlineDraft = headlineCandidate
    ? buildCandidateDraft(headlineCandidate)
    : null;
  const lead = visibleStaticArticles[0];

  if (!lead) {
    throw new Error("表示できる記事がありません。");
  }

  const hero: HomeExplorerArticle =
    headlineCandidate && headlineDraft
      ? {
          body: headlineDraft.body,
          date: "編集部選定",
          excerpt: headlineDraft.summary,
          featuredPost: {
            author: headlineCandidate.author,
            body: headlineDraft.translation,
            handle: headlineCandidate.author,
            likes: "-",
            newsValue: "Xポスト",
            reposts: "-",
            time: "",
            url: headlineCandidate.url,
          },
          id: headlineCandidate.id,
          image: getCandidateImage(headlineCandidate),
          label: "注目記事",
          relatedPosts: [],
          source: headlineCandidate.author,
          title: headlineDraft.title,
        }
      : {
          body: lead.body,
          date: lead.date,
          excerpt: lead.excerpt,
          featuredPost: lead.featuredPost,
          id: lead.id,
          image: lead.image,
          label: "注目記事",
          relatedPosts: lead.relatedPosts,
          source: lead.source,
          title: lead.title,
        };

  const publishedCandidateCards: HomeExplorerArticle[] = getPublicCandidates(
    candidates,
  )
    .filter((candidate) => candidate.id !== headlineCandidate?.id)
    .map((candidate) => {
      const draft = buildCandidateDraft(candidate);
      return {
        body: draft.body,
        date: formatCandidateDate(candidate.decidedAt ?? candidate.createdAt),
        excerpt: draft.summary,
        featuredPost: {
          author: candidate.author,
          body: draft.translation,
          handle: candidate.author,
          likes: "-",
          newsValue: "Xポスト",
          reposts: "-",
          time: "",
          url: candidate.url,
        },
        id: candidate.id,
        image: getCandidateImage(candidate),
        label: candidate.decision === "headline" ? "見出し" : "公開",
        relatedPosts: [],
        source: candidate.author,
        title: draft.title,
      };
    });

  const staticArticleCards: HomeExplorerArticle[] = visibleStaticArticles.map(
    (article, index) => ({
      body: article.body,
      date: article.date,
      excerpt: article.excerpt,
      featuredPost: article.featuredPost,
      id: article.id,
      image: article.image,
      label: index === 0 ? "最新" : article.category,
      relatedPosts: article.relatedPosts,
      source: article.source,
      title: article.title,
    }),
  );

  const articleCards = [...publishedCandidateCards, ...staticArticleCards];

  return (
    <main
      className="siteShell fixedBackdropShell homeShell articleIndexShell"
      style={{ "--page-bg": `url(${hero.image})` } as CSSProperties}
    >
      <SiteHeader />
      <HomeArticleExplorer articles={articleCards} hero={hero} />
      <SiteFooter />
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
