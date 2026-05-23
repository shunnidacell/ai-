import { SiteHeader } from "@/components/site-header";
import { readSitePages } from "@/lib/site-pages";

export default async function SnsPage() {
  const pages = await readSitePages();
  const page = pages.sns;

  return (
    <main className="simpleSiteShell">
      <SiteHeader />
      <section className="simplePagePanel">
        <span className="badge">SNS</span>
        <h1>{page.title}</h1>
        <p>{page.body}</p>
        <a href={page.linkHref} rel="noreferrer" target="_blank">
          {page.linkText}
        </a>
      </section>
    </main>
  );
}
