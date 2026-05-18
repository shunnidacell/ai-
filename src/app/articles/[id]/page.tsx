import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquareQuote, Sparkles } from "lucide-react";
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
    <main className="siteShell">
      <ArticleHeader />

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
            <p>{candidate.author} ・ X公式ポスト</p>
            <h1>{draft.title}</h1>
          </div>
        </section>

        <div className="articleBodyGrid">
          <div className="articleBody">
            <div className="generatedNotice">
              <Sparkles size={16} />
              Xの公式ポストをもとに、編集用ドラフトから記事化しています。
            </div>

            <section className="embeddedPostBlock">
              <h2>参照したXポスト</h2>
              <XPostCard
                post={{
                  author: candidate.author,
                  body: draft.translation,
                  handle: candidate.author,
                  likes: "-",
                  newsValue: "公式情報",
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
  return (
    <main className="siteShell">
      <ArticleHeader />

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

            {article.body.map((paragraph, index) => (
              <div key={paragraph}>
                <p>{paragraph}</p>
                {index === 0 && article.relatedPosts.length > 0 && (
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

function ArticleHeader() {
  return (
    <header className="articleTop">
      <Link className="backLink" href="/">
        <ArrowLeft size={18} />
        トップへ戻る
      </Link>
      <Link className="brand compactBrand" href="/">
        <span className="brandIcon">AI</span>
        <span>
          <strong>AI Insight JP</strong>
          <small>AIの今を、深く、分かりやすく。</small>
        </span>
      </Link>
    </header>
  );
}
