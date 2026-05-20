import { promises as fs } from "node:fs";
import path from "node:path";
import { readJsonFromDb, writeJsonToDb } from "@/lib/db-store";
import { latestArticles } from "@/lib/mock-data";

type ArticleVisibility = {
  hiddenArticleIds: string[];
};

const storePath = path.join(process.cwd(), "data", "article-visibility.json");
const storeKey = "article-visibility";

export async function readArticleVisibility(): Promise<ArticleVisibility> {
  const dbVisibility = await readJsonFromDb<Partial<ArticleVisibility>>(storeKey);

  if (dbVisibility) {
    return {
      hiddenArticleIds: dbVisibility.hiddenArticleIds ?? [],
    };
  }

  try {
    const raw = (await fs.readFile(storePath, "utf8")).replace(/^\uFEFF/, "");
    const parsed = JSON.parse(raw) as Partial<ArticleVisibility>;
    return {
      hiddenArticleIds: parsed.hiddenArticleIds ?? [],
    };
  } catch {
    return { hiddenArticleIds: [] };
  }
}

export async function writeArticleVisibility(visibility: ArticleVisibility) {
  if (await writeJsonToDb(storeKey, visibility)) {
    return;
  }

  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(visibility, null, 2), "utf8");
}

export async function getVisibleStaticArticles() {
  const visibility = await readArticleVisibility();
  const hiddenIds = new Set(visibility.hiddenArticleIds);
  return latestArticles.filter((article) => !hiddenIds.has(article.id));
}

export async function hideStaticArticle(id: string) {
  const article = latestArticles.find((item) => item.id === id);

  if (!article) {
    return { hidden: false, hiddenArticleIds: (await readArticleVisibility()).hiddenArticleIds };
  }

  const visibility = await readArticleVisibility();
  const hiddenIds = new Set(visibility.hiddenArticleIds);
  hiddenIds.add(id);
  const next = { hiddenArticleIds: [...hiddenIds] };
  await writeArticleVisibility(next);
  return { hidden: true, hiddenArticleIds: next.hiddenArticleIds };
}
