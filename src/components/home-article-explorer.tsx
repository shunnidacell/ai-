"use client";

import Image from "next/image";
import { X, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type HomeExplorerPost = {
  author: string;
  body: string;
  handle: string;
  likes: string;
  newsValue: string;
  reposts: string;
  time: string;
  url: string;
};

export type HomeExplorerArticle = {
  body: string[];
  date: string;
  excerpt: string;
  featuredPost?: HomeExplorerPost;
  id: string;
  image: string;
  label: string;
  relatedPosts: HomeExplorerPost[];
  source: string;
  title: string;
};

export function HomeArticleExplorer({
  articles,
  hero,
}: {
  articles: HomeExplorerArticle[];
  hero: HomeExplorerArticle;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const allArticles = useMemo(() => [hero, ...articles], [articles, hero]);
  const activeArticle = allArticles.find((article) => article.id === openId);

  useEffect(() => {
    if (!openId) {
      return;
    }

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [openId]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenId(null);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <>
      <button
        className="heroCard hasHeroImage articleOpenButton"
        onClick={() => setOpenId(hero.id)}
        type="button"
      >
        <div
          aria-hidden="true"
          className="heroFixedBg"
          style={{ backgroundImage: `url(${hero.image})` }}
        />
        <div className="heroOverlay" />
        <div className="heroContent">
          <span className="badge">{hero.label}</span>
          <h1>{hero.title}</h1>
          <p>{hero.excerpt}</p>
          <p className="sourceLine">
            <span className="sourceAvatar">{hero.source.slice(0, 1)}</span>
            {hero.source} ・ {hero.date} ・ AIニュース
          </p>
          <span className="heroCta">記事を開く</span>
        </div>
        <div className="heroVisual" aria-hidden="true">
          <Image
            src={hero.image}
            alt=""
            fill
            priority
            sizes="(max-width: 720px) 90vw, 48vw"
          />
        </div>
        <div className="sliderDots" aria-hidden="true">
          <span className="current" />
          <span />
          <span />
          <span />
        </div>
      </button>

      <div className="homeContentLayout">
        <section className="homeArticleGrid" aria-label="記事一覧">
          {articles.map((article) => (
            <button
              className="homeArticleCard articleOpenButton"
              key={`${article.id}-${article.label}`}
              onClick={() => setOpenId(article.id)}
              type="button"
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
                <span>□</span>
                {article.date}
              </p>
            </button>
          ))}
        </section>
      </div>

      {activeArticle && (
        <div
          className="articleExpandOverlay"
          onClick={() => setOpenId(null)}
          role="presentation"
        >
          <article
            aria-modal="true"
            className="articleExpandSheet"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <button
              aria-label="記事を閉じる"
              className="articleExpandClose"
              onClick={() => setOpenId(null)}
              type="button"
            >
              <X size={20} />
            </button>

            <div className="articleExpandHero">
              <Image
                src={activeArticle.image}
                alt=""
                fill
                sizes="(max-width: 720px) 100vw, 940px"
              />
              <div className="articleExpandHeroShade" />
              <div className="articleExpandTitle">
                <span className="badge">{activeArticle.label}</span>
                <h1>{activeArticle.title}</h1>
                <p>
                  {activeArticle.source} ・ {activeArticle.date}
                </p>
              </div>
            </div>

            <div className="articleExpandBody">
              <section className="articleExpandMain">
                <p className="articleExpandLead">{activeArticle.excerpt}</p>
                {activeArticle.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>

              <aside className="articleExpandPosts">
                <h2>関連するポスト</h2>
                <div className="articleExpandPostStack">
                  {[activeArticle.featuredPost, ...activeArticle.relatedPosts]
                    .filter((post): post is HomeExplorerPost => Boolean(post))
                    .map((post) => (
                      <a
                        className="articleExpandPost"
                        href={post.url}
                        key={post.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <span>{post.newsValue}</span>
                        <strong>{post.author}</strong>
                        <p>{post.body}</p>
                        <small>
                          Xで開く <ExternalLink size={12} />
                        </small>
                      </a>
                    ))}
                </div>
              </aside>
            </div>
          </article>
        </div>
      )}
    </>
  );
}
