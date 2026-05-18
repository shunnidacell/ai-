import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquareQuote, Sparkles } from "lucide-react";
import { XPostCard } from "@/components/x-post-card";
import { latestArticles } from "@/lib/mock-data";

export function generateStaticParams() {
  return latestArticles.map((article) => ({ id: article.id }));
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = latestArticles.find((item) => item.id === id);

  if (!article) {
    notFound();
  }

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
            <small>AIの今を、深く、分かりやすく。</small>
          </span>
        </Link>
      </header>

      <article className="articleLayout">
        <section className="articleHero">
          <Image src={article.image} alt="" fill priority sizes="100vw" />
          <div className="articleHeroOverlay" />
          <div className="articleHeroText">
            <span className="badge">{article.category}</span>
            <p>
              {article.source} ・ {article.date}
            </p>
            <h1>{article.title}</h1>
          </div>
        </section>

        <div className="articleBodyGrid">
          <div className="articleBody">
            <div className="generatedNotice">
              <Sparkles size={16} />
              見出し画像は記事テーマからAIで自動生成する想定です。
            </div>

            <section className="embeddedPostBlock">
              <h2>見出しで参照したXポスト</h2>
              <XPostCard post={article.featuredPost} />
            </section>

            {article.body.map((paragraph, index) => (
              <div key={paragraph}>
                <p>{paragraph}</p>
                {index === 0 && (
                  <section className="embeddedPostBlock inlinePosts">
                    <h2>関連ポスト</h2>
                    <div className="inlinePostGrid">
                      {article.relatedPosts.map((post) => (
                        <XPostCard compact key={post.handle} post={post} />
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
              {article.reactions.map((reaction) => (
                <blockquote key={reaction.handle}>
                  <span>{reaction.stance}</span>
                  <p>{reaction.quote}</p>
                  <cite>{reaction.handle}</cite>
                </blockquote>
              ))}
            </div>
          </aside>
        </div>
      </article>
    </main>
  );
}
