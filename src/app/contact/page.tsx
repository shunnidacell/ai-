import { SiteHeader } from "@/components/site-header";
import { readSitePages } from "@/lib/site-pages";

export default async function ContactPage() {
  const pages = await readSitePages();
  const page = pages.contact;

  return (
    <main className="simpleSiteShell">
      <SiteHeader />
      <section className="simplePagePanel">
        <span className="badge">Contact</span>
        <h1>{page.title}</h1>
        <p>{page.body}</p>
        <a href={page.linkHref}>{page.linkText}</a>
      </section>
    </main>
  );
}
