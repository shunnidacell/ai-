import { promises as fs } from "node:fs";
import path from "node:path";
import { readJsonFromDb, writeJsonToDb } from "@/lib/db-store";
import { latestArticles } from "@/lib/mock-data";

type StaticArticle = (typeof latestArticles)[number];

type StaticArticleOverride = {
  body?: string[];
  category?: string;
  date?: string;
  image?: string;
  imageSource?: string;
  source?: string;
  title?: string;
};

type ArticleVisibility = {
  articleOverrides: Record<string, StaticArticleOverride>;
  deletedArticleIds: string[];
  hiddenArticleIds: string[];
};

const storePath = path.join(process.cwd(), "data", "article-visibility.json");
const storeKey = "article-visibility";

export async function readArticleVisibility(): Promise<ArticleVisibility> {
  const dbVisibility = await readJsonFromDb<Partial<ArticleVisibility>>(storeKey);

  if (dbVisibility) {
    return {
      articleOverrides: dbVisibility.articleOverrides ?? {},
      deletedArticleIds: dbVisibility.deletedArticleIds ?? [],
      hiddenArticleIds: dbVisibility.hiddenArticleIds ?? [],
    };
  }

  try {
    const raw = (await fs.readFile(storePath, "utf8")).replace(/^\uFEFF/, "");
    const parsed = JSON.parse(raw) as Partial<ArticleVisibility>;
    return {
      articleOverrides: parsed.articleOverrides ?? {},
      deletedArticleIds: parsed.deletedArticleIds ?? [],
      hiddenArticleIds: parsed.hiddenArticleIds ?? [],
    };
  } catch {
    return { articleOverrides: {}, deletedArticleIds: [], hiddenArticleIds: [] };
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
  return latestArticles
    .filter((article) => !hiddenIds.has(article.id))
    .map((article) => applyStaticArticleOverride(article, visibility));
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
    articleOverrides: visibility.articleOverrides,
    deletedArticleIds: [...deletedIds],
    hiddenArticleIds: [...hiddenIds],
  };
  await writeArticleVisibility(next);
  return { hidden: true, ...next };
}

export async function restoreStaticArticle(id: string) {
  const visibility = await readArticleVisibility();
  const next = {
    articleOverrides: visibility.articleOverrides,
    deletedArticleIds: visibility.deletedArticleIds.filter((item) => item !== id),
    hiddenArticleIds: visibility.hiddenArticleIds.filter((item) => item !== id),
  };
  await writeArticleVisibility(next);
  return { restored: true, ...next };
}

export async function purgeStaticArticle(id: string) {
  const visibility = await readArticleVisibility();
  const next = {
    articleOverrides: visibility.articleOverrides,
    deletedArticleIds: visibility.deletedArticleIds.filter((item) => item !== id),
    hiddenArticleIds: visibility.hiddenArticleIds.filter((item) => item !== id),
  };
  await writeArticleVisibility(next);
  return { purged: true, ...next };
}

export async function getDeletedStaticArticles() {
  const visibility = await readArticleVisibility();
  const deletedIds = new Set(visibility.deletedArticleIds);
  return latestArticles
    .filter((article) => deletedIds.has(article.id))
    .map((article) => applyStaticArticleOverride(article, visibility));
}

export async function getHiddenStaticArticles() {
  const visibility = await readArticleVisibility();
  const deletedIds = new Set(visibility.deletedArticleIds);
  const hiddenIds = new Set(visibility.hiddenArticleIds);
  return latestArticles.filter(
    (article) => hiddenIds.has(article.id) && !deletedIds.has(article.id),
  ).map((article) => applyStaticArticleOverride(article, visibility));
}

export async function getStaticArticleById(id: string) {
  const visibility = await readArticleVisibility();
  const article = latestArticles.find((item) => item.id === id);
  return article ? applyStaticArticleOverride(article, visibility) : null;
}

export async function updateStaticArticle(
  id: string,
  draft: {
    body?: string;
    category?: string;
    date?: string;
    image?: string;
    imageSource?: string;
    source?: string;
    title?: string;
  },
) {
  const article = latestArticles.find((item) => item.id === id);

  if (!article) {
    return { updated: false };
  }

  const visibility = await readArticleVisibility();
  const current = visibility.articleOverrides[id] ?? {};
  const nextOverride: StaticArticleOverride = {
    ...current,
    body:
      draft.body === undefined
        ? current.body
        : draft.body
            .split(/\n{2,}/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean),
    category:
      draft.category === undefined
        ? current.category
        : draft.category.trim() || undefined,
    date: draft.date === undefined ? current.date : draft.date.trim() || undefined,
    image:
      draft.image === undefined ? current.image : draft.image.trim() || undefined,
    imageSource:
      draft.imageSource === undefined
        ? current.imageSource
        : draft.imageSource.trim() || undefined,
    source:
      draft.source === undefined ? current.source : draft.source.trim() || undefined,
    title:
      draft.title === undefined ? current.title : draft.title.trim() || undefined,
  };

  const next = {
    ...visibility,
    articleOverrides: {
      ...visibility.articleOverrides,
      [id]: nextOverride,
    },
  };
  await writeArticleVisibility(next);
  return { article: applyStaticArticleOverride(article, next), updated: true };
}

function applyStaticArticleOverride(
  article: StaticArticle,
  visibility: ArticleVisibility,
): StaticArticle {
  const override = visibility.articleOverrides[article.id];

  if (!override) {
    return article;
  }

  return {
    ...article,
    body: override.body?.length ? override.body : article.body,
    category: override.category ?? article.category,
    date: override.date ?? article.date,
    image: override.image ?? article.image,
    imageSource: override.imageSource ?? article.imageSource,
    source: override.source ?? article.source,
    title: override.title ?? article.title,
  };
}
