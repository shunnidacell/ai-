import Link from "next/link";
import { Search } from "lucide-react";

export function SiteHeader({ admin = false }: { admin?: boolean }) {
  const homeHref = admin ? "/published" : "/";

  return (
    <header className="siteHeader">
      <Link className="brand" href={homeHref}>
        <span className="brandIcon" aria-hidden="true" />
        <span>
          <strong>AI Insight JP</strong>
          <small>Xブックマークから作るAIニュース</small>
        </span>
      </Link>

      <label className="searchBox">
        <Search size={17} />
        <input placeholder="キーワードで検索" />
      </label>
    </header>
  );
}

export function SiteFooter({ admin = false }: { admin?: boolean }) {
  const snsHref = admin ? "/published/sns" : "/sns";
  const contactHref = admin ? "/published/contact" : "/contact";

  return (
    <footer className="siteFooter">
      <nav aria-label="フッター">
        <Link href={snsHref}>SNS</Link>
        <Link href={contactHref}>お問い合わせ</Link>
      </nav>
      <small>AI Insight JP</small>
    </footer>
  );
}
