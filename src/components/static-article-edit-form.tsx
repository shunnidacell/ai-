"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import type { latestArticles } from "@/lib/mock-data";

type StaticArticle = (typeof latestArticles)[number];

export function StaticArticleEditForm({ article }: { article: StaticArticle }) {
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setBusy(true);
    await fetch("/api/articles/visibility", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        draft: {
          body: String(formData.get("body") ?? ""),
          category: String(formData.get("category") ?? ""),
          date: String(formData.get("date") ?? ""),
          image: String(formData.get("image") ?? ""),
          imageSource: String(formData.get("imageSource") ?? ""),
          source: String(formData.get("source") ?? ""),
          title: String(formData.get("title") ?? ""),
        },
        id: article.id,
      }),
    });
    window.location.reload();
  }

  return (
    <form className="candidateEditForm" onSubmit={save}>
      <label>
        タイトル
        <input defaultValue={article.title} name="title" />
      </label>
      <label>
        画像URL
        <input defaultValue={article.image} name="image" />
      </label>
      <label>
        日付
        <input defaultValue={article.date} name="date" />
      </label>
      <label>
        出典
        <input defaultValue={article.source} name="source" />
      </label>
      <label>
        カテゴリ
        <input defaultValue={article.category} name="category" />
      </label>
      <label>
        画像説明
        <input defaultValue={article.imageSource} name="imageSource" />
      </label>
      <label>
        本文
        <textarea defaultValue={article.body.join("\n\n")} name="body" rows={8} />
      </label>
      <button disabled={busy} type="submit">
        {busy ? "保存中" : "編集内容を保存"}
      </button>
    </form>
  );
}
