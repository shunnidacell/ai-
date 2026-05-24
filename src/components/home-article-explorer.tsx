import Link from "next/link";

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
  return (
    <>
      <section className="simpleHero">
        <div className="simpleHeroText">
          <span>{hero.label}</span>
          <h1>{hero.title}</h1>
          <p>{hero.excerpt}</p>
          <Link href={`/articles/${hero.id}`}>記事を読む</Link>
        </div>
        <div
          aria-hidden="true"
          className="simpleHeroImage"
          style={{ backgroundImage: `url(${hero.image})` }}
        />
      </section>

      <section className="simpleArticleSection">
        <div className="simpleSectionHead">
          <h2>記事一覧</h2>
          <p>
            Xブックマークから選んだ記事候補を確認し、公開した記事だけを表示します。
          </p>
        </div>

        <div className="simpleArticleGrid">
          {articles.map((article) => (
            <Link
              className="simpleArticleCard"
              href={`/articles/${article.id}`}
              key={article.id}
            >
              <div
                aria-hidden="true"
                className="simpleArticleCardImage"
                style={{ backgroundImage: `url(${article.image})` }}
              />
              <span>{article.label}</span>
              <h3>{article.title}</h3>
              <p>{article.excerpt}</p>
              <small>
                {article.source} / {article.date}
              </small>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
