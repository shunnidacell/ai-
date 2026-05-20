import type { CSSProperties } from "react";
import { SiteHeader } from "@/components/site-header";
import { SitePageEditForm } from "@/components/site-page-edit-form";
import { readSitePages } from "@/lib/site-pages";

export default async function PublishedSnsAdminPage() {
  const pages = await readSitePages();
  const page = pages.sns;

  return (
    <main
      className="siteShell fixedBackdropShell"
      style={{ "--page-bg": 'url("/ai-chip-hero.png")' } as CSSProperties}
    >
      <SiteHeader admin />
      <section className="simplePagePanel adminSimpleEditor">
        <span className="badge">SNS編集</span>
        <h1>SNSページ編集</h1>
        <SitePageEditForm pageKey="sns" {...page} />
      </section>
    </main>
  );
}
