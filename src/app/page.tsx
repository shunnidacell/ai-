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
  const headlineCandidate = getHeadlineCandidates(candidates)[0];
  const headlineDraft = headlineCandidate
    ? buildCandidateDraft(headlineCandidate)
    : null;
  const lead = visibleStaticArticles[0];

  if (!lead && !headlineDraft) {
    throw new Error("表示できる記事がありません。");
  }

  const hero: HomeExplorerArticle =
    headlineCandidate && headlineDraft
      ? {
          body: headlineDraft.body,
          date: formatCandidateDate(headlineCandidate.decidedAt ?? headlineCandidate.createdAt),
          excerpt: headlineDraft.summary,
          featuredPost: {
            author: headlineCandidate.author,
            body: headlineDraft.translation,
            handle: headlineCandidate.author,
            likes: "-",
            newsValue: "元ポスト",
            reposts: "-",
            time: "",
            url: headlineCandidate.url,
          },
          id: headlineCandidate.id,
          image: getCandidateImage(headlineCandidate),
          label: "見出し",
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
          label: "見出し",
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
          newsValue: "元ポスト",
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

  const staticArticleCards: HomeExplorerArticle[] = visibleStaticArticles
    .filter((article) => article.id !== hero.id)
    .map((article) => ({
      body: article.body,
      date: article.date,
      excerpt: article.excerpt,
      featuredPost: article.featuredPost,
      id: article.id,
      image: article.image,
      label: article.category,
      relatedPosts: article.relatedPosts,
      source: article.source,
      title: article.title,
    }));

  const articleCards = [...publishedCandidateCards, ...staticArticleCards];

  return (
    <main className="simpleSiteShell">
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
