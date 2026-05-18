import type { CSSProperties } from "react";
import { SiteHeader } from "@/components/site-header";

export default function ContactPage() {
  return (
    <main
      className="siteShell fixedBackdropShell"
      style={{ "--page-bg": 'url("/ai-chip-hero.png")' } as CSSProperties}
    >
      <SiteHeader />
      <section className="simplePagePanel">
        <span className="badge">Contact</span>
        <h1>お問い合わせ</h1>
        <p>
          広告掲載、PR記事、情報提供、修正依頼はこちらから受け付けます。
        </p>
        <a href="mailto:contact@example.com">contact@example.com</a>
      </section>
    </main>
  );
}
