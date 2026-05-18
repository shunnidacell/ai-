import Image from "next/image";
import Link from "next/link";
import { Eye, Search, Sparkles, TrendingUp } from "lucide-react";
import { latestArticles, trends } from "@/lib/mock-data";
import {
  buildCandidateDraft,
  getCandidateImage,
  readCandidates,
} from "@/lib/x-candidates";

export const dynamic = "force-dynamic";

export default async function Home() {
  const candidates = await readCandidates();
  const headlineCandidate = candidates.find(
    (candidate) => candidate.decision === "headline",
  );
  const headlineDraft = headlineCandidate
    ? buildCandidateDraft(headlineCandidate)
    : null;
  const lead = latestArticles[0];

  const hero = headlineCandidate && headlineDraft
    ? {
        category: "注目",
        date: "候補管理から選択",
        excerpt: headlineDraft.summary,
        href: `/articles/${headlineCandidate.id}`,
        image: getCandidateImage(headlineCandidate),
        source: headlineCandidate.author,
        title: headlineDraft.title,
      }
    : {
        category: lead.category,
        date: lead.date,
        excerpt: lead.excerpt,
        href: `/articles/${lead.id}`,
        image: lead.image,
        source: lead.source,
        title: lead.title,
      };

  return (
    <main className="siteShell">
      <header className="siteHeader">
        <Link className="brand" href="/">
          <span className="brandIcon">AI</span>
          <span>
            <strong>AI Insight JP</strong>
            <small>AIの今を、深く、分かりやすく。</small>
          </span>
        </Link>

        <nav className="navLinks" aria-label="メインメニュー">
          <Link className="active" href="/">ホーム</Link>
          <a href="#latest">最新記事</a>
          <a href="#trend">注目トピック</a>
          <a href="#featured">注目記事</a>
        </nav>

        <label className="searchBox">
          <Search size={17} />
          <input placeholder="キーワードで検索" />
        </label>
      </header>

      <Link className="heroCard hasHeroImage" href={hero.href}>
        <div
          aria-hidden="true"
          className="heroFixedBg"
          style={{ backgroundImage: `url(${hero.image})` }}
        />
        <div className="heroOverlay" />
        <div className="heroContent">
          <span className="badge">{hero.category}</span>
          <p className="sourceLine">
            <span className="sourceAvatar">{hero.source.slice(0, 1)}</span>
            {hero.source} ・ {hero.date}
          </p>
          <h1>{hero.title}</h1>
          <p>{hero.excerpt}</p>
        </div>
      </Link>

      <section className="adSlot" aria-label="広告枠">
        <span>AD</span>
        <p>スポンサー枠 / Google AdSense想定</p>
      </section>

      <section className="dashboardGrid">
        <Panel title="最新記事" icon={<Sparkles size={18} />} id="latest">
          <div className="articleList">
            {latestArticles.map((article, index) => (
              <Link
                className="listArticle"
                href={`/articles/${article.id}`}
                key={article.id}
              >
                <Image
                  src={article.image}
                  alt=""
                  width={150}
                  height={86}
                  sizes="150px"
                />
                <div>
                  <div className="articleTopline">
                    {index === 0 && <span className="newBadge">NEW</span>}
                    <strong>{article.title}</strong>
                  </div>
                  <p>
                    {article.source} ・ {article.date}
                  </p>
                  <div className="tags">
                    <span>{article.category}</span>
                    <span>公式情報</span>
                    <span>X埋め込み</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel title="注目トピック" icon={<TrendingUp size={18} />} id="trend">
          <ol className="trendList">
            {trends.map((trend, index) => (
              <li key={trend.tag}>
                <span className={`rank ${trend.tone}`}>{index + 1}</span>
                <div>
                  <strong>#{trend.tag}</strong>
                  <small>{trend.posts}</small>
                </div>
                <span className={`spark ${trend.tone}`} />
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="注目記事" icon={<Eye size={18} />} id="featured">
          <div className="popularList">
            {latestArticles.map((article, index) => (
              <Link
                className="popularItem"
                href={`/articles/${article.id}`}
                key={article.id}
              >
                <span className="miniRank">{index + 1}</span>
                <Image src={article.image} alt="" width={88} height={50} />
                <div>
                  <strong>{article.title}</strong>
                  <small>{article.date}</small>
                </div>
                <em>{article.views}</em>
              </Link>
            ))}
          </div>
        </Panel>
      </section>
    </main>
  );
}

function Panel({
  children,
  icon,
  id,
  title,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  id: string;
  title: string;
}) {
  return (
    <section className="panel" id={id}>
      <div className="panelHeader">
        <h2>
          {icon}
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
