import { promises as fs } from "node:fs";
import path from "node:path";
import { readJsonFromDb, writeJsonToDb } from "@/lib/db-store";
import { latestArticles } from "@/lib/mock-data";

type ArticleVisibility = {
  deletedArticleIds: string[];
  hiddenArticleIds: string[];
};

const storePath = path.join(process.cwd(), "data", "article-visibility.json");
const storeKey = "article-visibility";

export async function readArticleVisibility(): Promise<ArticleVisibility> {
  const dbVisibility = await readJsonFromDb<Partial<ArticleVisibility>>(storeKey);

  if (dbVisibility) {
    return {
      deletedArticleIds: dbVisibility.deletedArticleIds ?? [],
      hiddenArticleIds: dbVisibility.hiddenArticleIds ?? [],
    };
  }

  try {
    const raw = (await fs.readFile(storePath, "utf8")).replace(/^\uFEFF/, "");
    const parsed = JSON.parse(raw) as Partial<ArticleVisibility>;
    return {
      deletedArticleIds: parsed.deletedArticleIds ?? [],
      hiddenArticleIds: parsed.hiddenArticleIds ?? [],
    };
  } catch {
    return { deletedArticleIds: [], hiddenArticleIds: [] };
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
  const hiddenIds = new Set([
    ...visibility.hiddenArticleIds,
    ...visibility.deletedArticleIds,
  ]);
  return latestArticles.filter((article) => !hiddenIds.has(article.id));
}

export async function hideStaticArticle(id: string, mode: "deleted" | "hidden" = "hidden") {
  const article = latestArticles.find((item) => item.id === id);

  if (!article) {
    const visibility = await readArticleVisibility();
    return { hidden: false, ...visibility };
  }

  const visibility = await readArticleVisibility();
  const hiddenIds = new Set(visibility.hiddenArticleIds);
  const deletedIds = new Set(visibility.deletedArticleIds);
  if (mode === "deleted") {
    deletedIds.add(id);
    hiddenIds.delete(id);
  } else {
    hiddenIds.add(id);
  }
  const next = {
    deletedArticleIds: [...deletedIds],
    hiddenArticleIds: [...hiddenIds],
  };
  await writeArticleVisibility(next);
  return { hidden: true, ...next };
}

export async function restoreStaticArticle(id: string) {
  const visibility = await readArticleVisibility();
  const next = {
    deletedArticleIds: visibility.deletedArticleIds.filter((item) => item !== id),
    hiddenArticleIds: visibility.hiddenArticleIds.filter((item) => item !== id),
  };
  await writeArticleVisibility(next);
  return { restored: true, ...next };
}

export async function purgeStaticArticle(id: string) {
  const visibility = await readArticleVisibility();
  const next = {
    deletedArticleIds: visibility.deletedArticleIds.filter((item) => item !== id),
    hiddenArticleIds: visibility.hiddenArticleIds.filter((item) => item !== id),
  };
  await writeArticleVisibility(next);
  return { purged: true, ...next };
}

export async function getDeletedStaticArticles() {
  const visibility = await readArticleVisibility();
  const deletedIds = new Set(visibility.deletedArticleIds);
  return latestArticles.filter((article) => deletedIds.has(article.id));
}
