import type { CSSProperties } from "react";
import { SiteHeader } from "@/components/site-header";

export default function SnsPage() {
  return (
    <main
      className="siteShell fixedBackdropShell"
      style={{ "--page-bg": 'url("/ai-chip-hero.png")' } as CSSProperties}
    >
      <SiteHeader />
      <section className="simplePagePanel">
        <span className="badge">SNS</span>
        <h1>SNS</h1>
        <p>
          AI Insight JPのSNS導線です。公開用アカウントを決めたら、ここにXやYouTubeなどのリンクを追加します。
        </p>
        <a href="https://x.com/" rel="noreferrer" target="_blank">
          Xを開く
        </a>
      </section>
    </main>
  );
}
