import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="siteHeader simpleHeader">
      <Link className="brand" href="/">
        <span className="brandIcon">AI</span>
        <span>
          <strong>AI Insight JP</strong>
          <small>AIの今を、深く、分かりやすく。</small>
        </span>
      </Link>

      <nav className="navLinks simpleNav" aria-label="メインメニュー">
        <Link href="/sns">SNS</Link>
        <Link href="/contact">お問い合わせ</Link>
      </nav>
    </header>
  );
}
