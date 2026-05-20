import { promises as fs } from "node:fs";
import path from "node:path";
import { readJsonFromDb, writeJsonToDb } from "@/lib/db-store";

export type EditablePageKey = "contact" | "sns";

type EditablePage = {
  body: string;
  linkHref: string;
  linkText: string;
  title: string;
};

type SitePages = Record<EditablePageKey, EditablePage>;

const storePath = path.join(process.cwd(), "data", "site-pages.json");
const storeKey = "site-pages";

const defaults: SitePages = {
  contact: {
    body: "広告掲載、PR記事、情報提供、修正依頼はこちらから受け付けます。",
    linkHref: "mailto:contact@example.com",
    linkText: "contact@example.com",
    title: "お問い合わせ",
  },
  sns: {
    body: "AI Insight JPのSNS導線です。公開用アカウントを決めたら、ここにXやYouTubeなどのリンクを追加します。",
    linkHref: "https://x.com/",
    linkText: "Xを開く",
    title: "SNS",
  },
};

export async function readSitePages(): Promise<SitePages> {
  const dbPages = await readJsonFromDb<Partial<SitePages>>(storeKey);

  if (dbPages) {
    return { ...defaults, ...dbPages };
  }

  try {
    const raw = (await fs.readFile(storePath, "utf8")).replace(/^\uFEFF/, "");
    return { ...defaults, ...(JSON.parse(raw) as Partial<SitePages>) };
  } catch {
    return defaults;
  }
}

export async function updateSitePage(
  key: EditablePageKey,
  nextPage: EditablePage,
) {
  const pages = await readSitePages();
  const next = {
    ...pages,
    [key]: {
      body: nextPage.body.trim(),
      linkHref: nextPage.linkHref.trim(),
      linkText: nextPage.linkText.trim(),
      title: nextPage.title.trim(),
    },
  };
  if (await writeJsonToDb(storeKey, next)) {
    return next[key];
  }

  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(next, null, 2), "utf8");
  return next[key];
}
