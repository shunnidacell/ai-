import Link from "next/link";
import { Search } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="siteHeader">
      <Link className="brand" href="/">
        <span className="brandIcon">AI</span>
        <span>
          <strong>AI Insight JP</strong>
          <small>AIの今を、深く、わかりやすく。</small>
        </span>
      </Link>

      <nav className="navLinks" aria-label="メインメニュー">
        <Link className="active" href="/">
          ホーム
        </Link>
        <a href="#latest">最新記事</a>
        <a href="#trend">トレンド</a>
        <a href="#featured">人気記事</a>
        <Link href="/contact">編集部便り</Link>
      </nav>

      <label className="searchBox">
        <Search size={17} />
        <input placeholder="キーワードで検索" />
      </label>
    </header>
  );
}
