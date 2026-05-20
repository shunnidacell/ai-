import type { CSSProperties } from "react";
import { SiteHeader } from "@/components/site-header";
import { SitePageEditForm } from "@/components/site-page-edit-form";
import { readSitePages } from "@/lib/site-pages";

export default async function PublishedContactAdminPage() {
  const pages = await readSitePages();
  const page = pages.contact;

  return (
    <main
      className="siteShell fixedBackdropShell"
      style={{ "--page-bg": 'url("/ai-chip-hero.png")' } as CSSProperties}
    >
      <SiteHeader admin />
      <section className="simplePagePanel adminSimpleEditor">
        <span className="badge">お問い合わせ編集</span>
        <h1>お問い合わせページ編集</h1>
        <SitePageEditForm pageKey="contact" {...page} />
      </section>
    </main>
  );
}
