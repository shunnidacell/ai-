import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { XEmbed } from "@/components/x-embed";
import { getStaticArticleById } from "@/lib/article-visibility";
import {
  buildCandidateDraft,
  getCandidateImage,
  readCandidates,
} from "@/lib/x-candidates";
import type { Article, XPost } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

type DisplayArticle = {
  body: string[];
  category: string;
  date: string;
  excerpt: string;
  image?: string;
  source: string;
  title: string;
  xPost?: XPost;
};

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) {
    notFound();
  }

  return (
    <main className="simpleSiteShell">
      <SiteHeader />

      <article className="simpleArticlePage">
        <Link className="simpleBackLink" href="/">
          記事一覧へ戻る
        </Link>

        <header className="simpleArticleHero">
          <div className="simpleArticleHeroText">
            <span>{article.category}</span>
            <h1>{article.title}</h1>
            <p>{article.excerpt}</p>
            <small>
              {article.source} / {article.date}
            </small>
          </div>
          {article.image && (
            <div
              aria-hidden="true"
              className="simpleArticleHeroImage"
              style={{ backgroundImage: `url(${article.image})` }}
            />
          )}
        </header>

        <div className="simpleArticleBody">
          <section className="simpleArticleCopy">
            {article.body.map((paragraph) =>
              paragraph.startsWith("### ") ? (
                <h2 key={paragraph}>{paragraph.replace(/^###\s+/, "")}</h2>
              ) : (
                <p key={paragraph}>{paragraph}</p>
              ),
            )}
          </section>

          <aside className="simpleSourcePanel">
            <h2>元ポスト</h2>
            {article.xPost ? (
              <XEmbed url={article.xPost.url} />
            ) : (
              <p>元ポストはまだ登録されていません。</p>
            )}
          </aside>
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}

async function getArticle(id: string): Promise<DisplayArticle | null> {
  const staticArticle = await getStaticArticleById(id);

  if (staticArticle) {
    return fromStaticArticle(staticArticle);
  }

  const candidates = await readCandidates();
  const candidate = candidates.find(
    (item) =>
      item.id === id &&
      (item.decision === "published" || item.decision === "headline"),
  );

  if (!candidate) {
    return null;
  }

  const draft = buildCandidateDraft(candidate);

  return {
    body: draft.body,
    category: candidate.decision === "headline" ? "見出し" : "公開",
    date: formatCandidateDate(candidate.decidedAt ?? candidate.createdAt),
    excerpt: draft.summary,
    image: getCandidateImage(candidate),
    source: candidate.author,
    title: draft.title,
    xPost: {
      author: candidate.author,
      body: draft.translation,
      handle: candidate.author,
      likes: "-",
      newsValue: "元ポスト",
      reposts: "-",
      time: "",
      url: candidate.url,
    },
  };
}

function fromStaticArticle(article: Article): DisplayArticle {
  return {
    body: article.body,
    category: article.category,
    date: article.date,
    excerpt: article.excerpt,
    image: article.image,
    source: article.source,
    title: article.title,
    xPost: article.featuredPost,
  };
}

function formatCandidateDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}
