import Link from "next/link";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquareQuote,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { XPostCard } from "@/components/x-post-card";
import { latestArticles } from "@/lib/mock-data";
import {
  buildCandidateDraft,
  getCandidateImage,
  readCandidates,
} from "@/lib/x-candidates";

export const dynamic = "force-dynamic";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = latestArticles.find((item) => item.id === id);

  if (article) {
    return <PublishedArticle article={article} />;
  }

  const candidates = await readCandidates();
  const candidate = candidates.find(
    (item) =>
      item.id === id &&
      (item.decision === "published" || item.decision === "headline"),
  );

  if (!candidate) {
    notFound();
  }

  const draft = buildCandidateDraft(candidate);

  return (
    <main
      className="siteShell fixedBackdropShell articleBackdropShell"
      style={
        {
          "--page-bg": `url(${getCandidateImage(candidate)})`,
        } as CSSProperties
      }
    >
      <SiteHeader />

      <article className="articleLayout">
        <section className="articleHero">
          <div
            aria-hidden="true"
            className="articleHeroFixedBg"
            style={{ backgroundImage: `url(${getCandidateImage(candidate)})` }}
          />
          <div className="articleHeroOverlay" />
          <div className="articleHeroText">
            <span className="badge">注目</span>
            <p>{candidate.author} ・ Xポスト</p>
            <h1>{draft.title}</h1>
          </div>
        </section>

        <div className="articleBodyGrid">
          <div className="articleBody">
            <div className="generatedNotice">
              <Sparkles size={16} />
              Xポストをもとに編集したAIニュース記事です。
            </div>

            <section className="embeddedPostBlock">
              <h2>参照したXポスト</h2>
              <XPostCard
                post={{
                  author: candidate.author,
                  body: draft.translation,
                  handle: candidate.author,
                  likes: "-",
                  newsValue: "Xポスト",
                  reposts: "-",
                  time: "",
                  url: candidate.url,
                }}
              />
            </section>

            <p>{draft.summary}</p>
            {draft.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <aside className="reactionPanel">
            <h2>
              <MessageSquareQuote size={18} />
              編集メモ
            </h2>
            <div className="reactionStack">
              <blockquote>
                <span>ソース</span>
                <p>この記事は登録済みのXポストURLを一次情報として作成されています。</p>
                <cite>{candidate.url}</cite>
              </blockquote>
            </div>
          </aside>
        </div>
      </article>
    </main>
  );
}

function PublishedArticle({
  article,
}: {
  article: (typeof latestArticles)[number];
}) {
  const index = latestArticles.findIndex((item) => item.id === article.id);
  const previous = latestArticles[index - 1] ?? latestArticles.at(-1);
  const next = latestArticles[index + 1] ?? latestArticles[0];

  return (
    <main
      className="siteShell fixedBackdropShell articleBackdropShell"
      style={
        {
          "--page-bg": `url(${article.image})`,
        } as CSSProperties
      }
    >
      <SiteHeader />
      <ArticleSidePager previous={previous} next={next} />

      <article className="articleLayout">
        <section className="articleHero">
          <div
            aria-hidden="true"
            className="articleHeroFixedBg"
            style={{ backgroundImage: `url(${article.image})` }}
          />
          <div className="articleHeroOverlay" />
          <div className="articleHeroText">
            <span className="badge">{article.category}</span>
            <p>
              {article.source} ・ {article.date}
            </p>
            <p className="imageCredit">{article.imageSource}</p>
            <h1>{article.title}</h1>
          </div>
        </section>

        <div className="articleBodyGrid">
          <div className="articleBody">
            <div className="generatedNotice">
              <Sparkles size={16} />
              公式ポストと関連情報をもとに編集したAIニュース記事です。
            </div>

            <section className="embeddedPostBlock">
              <h2>参照したXポスト</h2>
              <XPostCard post={article.featuredPost} />
            </section>

            {article.body.map((paragraph, bodyIndex) => (
              <div key={paragraph}>
                <p>{paragraph}</p>
                {bodyIndex === 0 && article.relatedPosts.length > 0 && (
                  <section className="embeddedPostBlock inlinePosts">
                    <h2>関連ポスト</h2>
                    <div className="inlinePostGrid">
                      {article.relatedPosts.map((post) => (
                        <XPostCard compact key={post.url} post={post} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            ))}
          </div>

          <aside className="reactionPanel">
            <h2>
              <MessageSquareQuote size={18} />
              一般ユーザーの反応
            </h2>
            <div className="reactionStack">
              {article.reactions.length === 0 ? (
                <blockquote>
                  <span>準備中</span>
                  <p>一般ユーザーの反応は、実際のポストを確認できたものだけ掲載します。</p>
                  <cite>AI Insight JP</cite>
                </blockquote>
              ) : (
                article.reactions.map((reaction) => (
                  <blockquote key={reaction.handle}>
                    <span>{reaction.stance}</span>
                    <p>{reaction.quote}</p>
                    <cite>{reaction.handle}</cite>
                  </blockquote>
                ))
              )}
            </div>
          </aside>
        </div>
      </article>
    </main>
  );
}

function ArticleSidePager({
  next,
  previous,
}: {
  next?: (typeof latestArticles)[number];
  previous?: (typeof latestArticles)[number];
}) {
  return (
    <>
      {previous && (
        <Link
          aria-label={`前の記事: ${previous.title}`}
          className="sidePager sidePagerLeft"
          href={`/articles/${previous.id}`}
        >
          <ChevronLeft size={26} />
          <span>前の記事</span>
        </Link>
      )}
      {next && (
        <Link
          aria-label={`次の記事: ${next.title}`}
          className="sidePager sidePagerRight"
          href={`/articles/${next.id}`}
        >
          <span>次の記事</span>
          <ChevronRight size={26} />
        </Link>
      )}
    </>
  );
}
