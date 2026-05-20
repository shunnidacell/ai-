"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import type { EditablePageKey } from "@/lib/site-pages";

export function SitePageEditForm({
  body,
  linkHref,
  linkText,
  pageKey,
  title,
}: {
  body: string;
  linkHref: string;
  linkText: string;
  pageKey: EditablePageKey;
  title: string;
}) {
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setBusy(true);
    await fetch("/api/site-pages", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        body: String(formData.get("body") ?? ""),
        key: pageKey,
        linkHref: String(formData.get("linkHref") ?? ""),
        linkText: String(formData.get("linkText") ?? ""),
        title: String(formData.get("title") ?? ""),
      }),
    });
    window.location.reload();
  }

  return (
    <form className="candidateEditForm" onSubmit={save}>
      <label>
        見出し
        <input defaultValue={title} name="title" />
      </label>
      <label>
        本文
        <textarea defaultValue={body} name="body" rows={5} />
      </label>
      <label>
        リンクURL
        <input defaultValue={linkHref} name="linkHref" />
      </label>
      <label>
        リンク表示
        <input defaultValue={linkText} name="linkText" />
      </label>
      <button disabled={busy} type="submit">
        {busy ? "保存中" : "保存"}
      </button>
    </form>
  );
}
